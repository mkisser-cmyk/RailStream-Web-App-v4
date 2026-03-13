// The Yard Chat — Backend API
// Supports: rooms, messages, presence (who's online), moderation, pinned messages
// SSE (Server-Sent Events) for real-time push — eliminates polling
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { chatBus, relayToOtherWorkers, isClusterWorker } from '@/lib/chat-bus';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'railstream';

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URL);
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

// ── Server-side cache for rooms data (reduces DB load dramatically) ──
let roomsCache = null;
let roomsCacheTime = 0;
const ROOMS_CACHE_TTL = 15000;
let yardEnsured = false;

// ── Connected clients tracking (replaces chat_presence DB for online status) ──
// Map: username -> { rooms: Set, connectedAt, tier, is_admin, is_mod }
const connectedClients = new Map();

function getOnlineUsersForRoom(roomId) {
  const users = [];
  connectedClients.forEach((info, username) => {
    if (info.rooms.has(roomId)) {
      users.push({ username, tier: info.tier, is_admin: info.is_admin, is_mod: info.is_mod });
    }
  });
  return users;
}

function broadcastPresenceUpdate(roomId) {
  const users = getOnlineUsersForRoom(roomId);
  chatBus.emit('presence', { room_id: roomId, online_users: users, online_count: users.length });
}

// ── GET: Fetch messages, rooms, or presence ──
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'messages';

    // ── SSE STREAM — Real-time push (replaces polling) ──
    if (action === 'stream') {
      const username = searchParams.get('user');
      const tier = searchParams.get('tier') || 'guest';
      const isAdmin = searchParams.get('is_admin') === 'true';
      const roomsParam = searchParams.get('rooms') || 'the-yard';
      const userRooms = new Set(roomsParam.split(',').filter(Boolean));

      // Register this client as connected
      connectedClients.set(username || `anon-${Date.now()}`, {
        rooms: userRooms,
        tier,
        is_admin: isAdmin,
        is_mod: false,
        connectedAt: Date.now(),
      });

      // Broadcast presence update for all joined rooms
      userRooms.forEach(roomId => broadcastPresenceUpdate(roomId));

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const send = (event, data) => {
            try {
              controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            } catch (e) { /* connection closed */ }
          };

          // Send initial presence for all rooms
          userRooms.forEach(roomId => {
            const users = getOnlineUsersForRoom(roomId);
            send('presence', { room_id: roomId, online_users: users, online_count: users.length });
          });

          // Listen for new messages
          const onMessage = (msg) => {
            if (userRooms.has(msg.room_id)) {
              send('message', msg);
            }
          };
          chatBus.on('chat:message', onMessage);

          // Listen for presence changes
          const onPresence = (data) => {
            if (userRooms.has(data.room_id)) {
              send('presence', data);
            }
          };
          chatBus.on('presence', onPresence);

          // Listen for room updates (join/leave requests from this client)
          const onRoomUpdate = (data) => {
            if (data.username === username) {
              if (data.action === 'join') {
                userRooms.add(data.room_id);
                const clientInfo = connectedClients.get(username);
                if (clientInfo) clientInfo.rooms.add(data.room_id);
                broadcastPresenceUpdate(data.room_id);
                const users = getOnlineUsersForRoom(data.room_id);
                send('presence', { room_id: data.room_id, online_users: users, online_count: users.length });
              } else if (data.action === 'leave') {
                userRooms.delete(data.room_id);
                const clientInfo = connectedClients.get(username);
                if (clientInfo) clientInfo.rooms.delete(data.room_id);
                broadcastPresenceUpdate(data.room_id);
              }
            }
          };
          chatBus.on('room:update', onRoomUpdate);

          // Listen for moderation events
          const onModeration = (data) => {
            if (userRooms.has(data.room_id) || data.room_id === '*') {
              send('moderation', data);
            }
          };
          chatBus.on('moderation', onModeration);

          // Listen for pin events
          const onPin = (data) => {
            if (userRooms.has(data.room_id)) {
              send('pin', data);
            }
          };
          chatBus.on('pin', onPin);

          // Keep-alive every 30 seconds (prevents proxy timeouts)
          const keepAlive = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': keepalive\n\n'));
            } catch (e) {
              clearInterval(keepAlive);
            }
          }, 30000);

          // Cleanup on disconnect
          request.signal.addEventListener('abort', () => {
            clearInterval(keepAlive);
            chatBus.off('chat:message', onMessage);
            chatBus.off('presence', onPresence);
            chatBus.off('room:update', onRoomUpdate);
            chatBus.off('moderation', onModeration);
            chatBus.off('pin', onPin);

            // Remove from connected clients
            connectedClients.delete(username || `anon-${Date.now()}`);
            // Broadcast updated presence
            userRooms.forEach(roomId => broadcastPresenceUpdate(roomId));
          });
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
      });
    }

    const db = await getDb();

    // ── GET MESSAGES ──
    if (action === 'messages') {
      const room = searchParams.get('room') || 'the-yard';
      const after = searchParams.get('after'); // Only fetch new messages after this timestamp
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

      const query = { room_id: room };
      if (after) {
        query.created_at = { $gt: new Date(after) };
      }

      const messages = await db.collection('chat_messages')
        .find(query)
        .sort({ created_at: after ? 1 : -1 }) // If polling for new, sort asc; otherwise get latest desc
        .limit(limit)
        .toArray();

      // Always return in chronological order
      const formatted = (after ? messages : messages.reverse()).map(msg => ({
        id: msg.id,
        room_id: msg.room_id,
        username: msg.username,
        tier: msg.tier,
        message: msg.message,
        created_at: msg.created_at?.toISOString?.() || msg.created_at,
        is_admin: msg.is_admin || false,
        is_mod: msg.is_mod || false,
        is_system: msg.is_system || false,
        pinned: msg.pinned || false,
        reactions: msg.reactions || {},
      }));

      return NextResponse.json({ ok: true, messages: formatted, room });
    }

    // ── GET ROOMS ──
    if (action === 'rooms') {
      // Piggyback presence (for non-SSE clients as fallback)
      const presenceUser = searchParams.get('user');
      const presenceTier = searchParams.get('tier') || 'guest';
      const presenceAdmin = searchParams.get('is_admin') === 'true';
      const presenceRooms = searchParams.get('rooms');
      if (presenceUser) {
        // Register in connectedClients map (covers non-SSE clients too)
        const roomIds = presenceRooms ? presenceRooms.split(',').filter(Boolean) : ['the-yard'];
        connectedClients.set(presenceUser, {
          rooms: new Set(roomIds),
          tier: presenceTier,
          is_admin: presenceAdmin,
          is_mod: false,
          connectedAt: Date.now(),
        });
      }

      // Auto-ensure "the-yard" once per server lifecycle
      if (!yardEnsured) {
        await db.collection('chat_rooms').updateOne(
          { id: 'the-yard' },
          { $setOnInsert: { id: 'the-yard', name: 'The Yard', type: 'global', camera_id: null, pinned_message: null, created_at: new Date() } },
          { upsert: true }
        );
        yardEnsured = true;
      }

      // Serve from cache if fresh
      const now = Date.now();
      if (roomsCache && (now - roomsCacheTime) < ROOMS_CACHE_TTL) {
        // Update online counts from in-memory connectedClients (instant, no DB)
        const freshResponse = { ...roomsCache, rooms: roomsCache.rooms.map(r => ({
          ...r,
          online_count: getOnlineUsersForRoom(r.id).length,
          online_users: getOnlineUsersForRoom(r.id),
        }))};
        return NextResponse.json(freshResponse);
      }

      // Cache miss — get rooms from DB (online data from memory, NOT from DB)
      const rooms = await db.collection('chat_rooms').find({}).sort({ type: 1, name: 1 }).toArray();

      const formatted = rooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        camera_id: r.camera_id || null,
        online_count: getOnlineUsersForRoom(r.id).length,
        online_users: getOnlineUsersForRoom(r.id),
        pinned_message: r.pinned_message || null,
      }));

      // Cache the base response (online counts are added fresh each time)
      const response = { ok: true, rooms: formatted };
      roomsCache = response;
      roomsCacheTime = now;

      return NextResponse.json(response);
    }

    // ── GET PRESENCE (who's online in a room) ──
    if (action === 'presence') {
      const room = searchParams.get('room') || 'the-yard';
      const cutoff = new Date(Date.now() - 300000);

      const users = await db.collection('chat_presence')
        .find({ room_id: room, last_seen: { $gt: cutoff } })
        .sort({ username: 1 })
        .toArray();

      const formatted = users.map(u => ({
        username: u.username,
        tier: u.tier,
        is_admin: u.is_admin || false,
        is_mod: u.is_mod || false,
      }));

      return NextResponse.json({ ok: true, users: formatted, room, count: formatted.length });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

// ── POST: Send message, update presence, moderate, pin, create room ──
export async function POST(request) {
  try {
    const body = await request.json();
    const action = body.action || 'message';
    const db = await getDb();

    // Debug: log incoming chat POST actions
    console.log(`[Chat POST] action=${action}, user=${body.user?.username || body.username || 'none'}, room=${body.room_id || 'none'}`);

    // ── ROOM UPDATE (join/leave without SSE reconnection) ──
    if (action === 'room_update') {
      const { username, room_id, update } = body;
      if (!username || !room_id) return NextResponse.json({ ok: false, error: 'username and room_id required' }, { status: 400 });

      // Update in-memory connected clients
      const clientInfo = connectedClients.get(username);
      if (clientInfo) {
        if (update === 'join') {
          clientInfo.rooms.add(room_id);
        } else if (update === 'leave') {
          clientInfo.rooms.delete(room_id);
        }
      }

      // Emit room:update event so SSE handler adjusts its subscription
      chatBus.emit('room:update', { username, room_id, action: update });

      // Broadcast presence update for the affected room
      broadcastPresenceUpdate(room_id);

      return NextResponse.json({ ok: true });
    }

    // ── SEND MESSAGE ──
    if (action === 'message') {
      const { message, user, room_id } = body;
      if (!message?.trim()) return NextResponse.json({ ok: false, error: 'Message required' }, { status: 400 });
      if (!user?.username) return NextResponse.json({ ok: false, error: 'Must be logged in' }, { status: 401 });

      const roomId = room_id || 'the-yard';

      // Check if user is muted
      const mute = await db.collection('chat_moderation').findOne({
        username: user.username,
        type: 'mute',
        room_id: { $in: [roomId, '*'] }, // '*' = global mute
        expires_at: { $gt: new Date() },
      });
      if (mute) {
        const remaining = Math.ceil((mute.expires_at - Date.now()) / 60000);
        return NextResponse.json({ ok: false, error: `You are muted for ${remaining} more minute(s)` }, { status: 403 });
      }

      // Check if user is banned
      const ban = await db.collection('chat_moderation').findOne({
        username: user.username,
        type: 'ban',
        room_id: { $in: [roomId, '*'] },
      });
      if (ban) {
        return NextResponse.json({ ok: false, error: 'You are banned from chat' }, { status: 403 });
      }

      const cleanMessage = message.trim().slice(0, 500);
      const newMsg = {
        id: uuidv4(),
        room_id: roomId,
        username: user.username,
        tier: user.membership_tier || 'guest',
        message: cleanMessage,
        is_admin: user.is_admin || false,
        is_mod: user.is_mod || false,
        is_system: false,
        pinned: false,
        reactions: {},
        created_at: new Date(),
      };

      await db.collection('chat_messages').insertOne(newMsg);

      // ── Broadcast message via SSE to all connected clients ──
      const msgPayload = { ...newMsg, created_at: newMsg.created_at.toISOString() };
      chatBus.emit('chat:message', msgPayload);
      relayToOtherWorkers('chat:message', msgPayload); // Cross-worker relay

      return NextResponse.json({
        ok: true,
        message: { ...newMsg, created_at: newMsg.created_at.toISOString() },
      });
    }

    // ── PRESENCE HEARTBEAT ──
    if (action === 'presence') {
      const { user, room_id } = body;
      if (!user?.username) return NextResponse.json({ ok: false }, { status: 401 });

      const roomId = room_id || 'the-yard';
      await db.collection('chat_presence').updateOne(
        { username: user.username, room_id: roomId },
        {
          $set: {
            username: user.username,
            tier: user.membership_tier || 'guest',
            is_admin: user.is_admin || false,
            is_mod: user.is_mod || false,
            room_id: roomId,
            last_seen: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({ ok: true });
    }

    // ── MODERATE: mute/ban/unban ──
    if (action === 'moderate') {
      const { user, target_username, type, room_id, duration_minutes } = body;
      if (!user?.is_admin && !user?.is_mod) {
        return NextResponse.json({ ok: false, error: 'Moderator access required' }, { status: 403 });
      }

      const roomId = room_id || '*';

      if (type === 'mute') {
        const duration = Math.min(duration_minutes || 5, 1440); // Max 24 hours
        await db.collection('chat_moderation').updateOne(
          { username: target_username, type: 'mute', room_id: roomId },
          {
            $set: {
              username: target_username,
              type: 'mute',
              room_id: roomId,
              expires_at: new Date(Date.now() + duration * 60000),
              moderator: user.username,
              created_at: new Date(),
            },
          },
          { upsert: true }
        );

        // Post system message
        await db.collection('chat_messages').insertOne({
          id: uuidv4(),
          room_id: roomId === '*' ? 'the-yard' : roomId,
          username: 'System',
          tier: 'system',
          message: `${target_username} has been muted for ${duration} minute(s) by ${user.username}`,
          is_system: true,
          pinned: false,
          created_at: new Date(),
        });

        return NextResponse.json({ ok: true, action: 'muted', target: target_username, duration });
      }

      if (type === 'ban') {
        await db.collection('chat_moderation').updateOne(
          { username: target_username, type: 'ban', room_id: roomId },
          {
            $set: {
              username: target_username,
              type: 'ban',
              room_id: roomId,
              moderator: user.username,
              created_at: new Date(),
            },
          },
          { upsert: true }
        );

        await db.collection('chat_messages').insertOne({
          id: uuidv4(),
          room_id: roomId === '*' ? 'the-yard' : roomId,
          username: 'System',
          tier: 'system',
          message: `${target_username} has been banned from chat by ${user.username}`,
          is_system: true,
          pinned: false,
          created_at: new Date(),
        });

        return NextResponse.json({ ok: true, action: 'banned', target: target_username });
      }

      if (type === 'unban' || type === 'unmute') {
        await db.collection('chat_moderation').deleteMany({
          username: target_username,
          type: type === 'unban' ? 'ban' : 'mute',
          room_id: roomId,
        });
        return NextResponse.json({ ok: true, action: type, target: target_username });
      }

      return NextResponse.json({ ok: false, error: 'Unknown moderation type' }, { status: 400 });
    }

    // ── PIN MESSAGE ──
    if (action === 'pin') {
      const { user, message_id, room_id, pinned } = body;
      if (!user?.is_admin && !user?.is_mod) {
        return NextResponse.json({ ok: false, error: 'Moderator access required' }, { status: 403 });
      }

      if (message_id) {
        // Pin/unpin a specific message
        await db.collection('chat_messages').updateOne(
          { id: message_id },
          { $set: { pinned: pinned !== false } }
        );
      }

      // Also set room-level pinned message
      if (room_id && body.pinned_text) {
        await db.collection('chat_rooms').updateOne(
          { id: room_id },
          { $set: { pinned_message: body.pinned_text } }
        );
      }

      return NextResponse.json({ ok: true });
    }

    // ── REACT TO MESSAGE (toggle emoji reaction) ──
    if (action === 'react') {
      const { user, message_id, emoji } = body;
      if (!user?.username) return NextResponse.json({ ok: false, error: 'Must be logged in' }, { status: 401 });
      if (!message_id || !emoji) return NextResponse.json({ ok: false, error: 'message_id and emoji required' }, { status: 400 });

      // Validate emoji is one of the allowed set
      const ALLOWED_EMOJIS = ['🚂', '👍', '🔥', '❤️', '👀', '🎉', '😂', '💯'];
      if (!ALLOWED_EMOJIS.includes(emoji)) {
        return NextResponse.json({ ok: false, error: 'Invalid emoji' }, { status: 400 });
      }

      const msg = await db.collection('chat_messages').findOne({ id: message_id });
      if (!msg) return NextResponse.json({ ok: false, error: 'Message not found' }, { status: 404 });

      const reactions = msg.reactions || {};
      const users = reactions[emoji] || [];
      const userIndex = users.indexOf(user.username);

      if (userIndex >= 0) {
        // Remove reaction (toggle off)
        users.splice(userIndex, 1);
        if (users.length === 0) {
          delete reactions[emoji];
        } else {
          reactions[emoji] = users;
        }
      } else {
        // Add reaction (toggle on)
        reactions[emoji] = [...users, user.username];
      }

      await db.collection('chat_messages').updateOne(
        { id: message_id },
        { $set: { reactions } }
      );

      return NextResponse.json({ ok: true, reactions, message_id });
    }

    // ── CREATE / ENSURE ROOM ──
    if (action === 'ensure_room') {
      const { room_id, name, type, camera_id } = body;
      if (!room_id || !name) return NextResponse.json({ ok: false, error: 'room_id and name required' }, { status: 400 });

      await db.collection('chat_rooms').updateOne(
        { id: room_id },
        {
          $setOnInsert: {
            id: room_id,
            name,
            type: type || 'camera',
            camera_id: camera_id || null,
            pinned_message: null,
            created_at: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({ ok: true, room_id });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE: Remove a message (admin/mod only) ──
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    const body = await request.json();
    const { user } = body;

    if (!messageId) return NextResponse.json({ ok: false, error: 'Message ID required' }, { status: 400 });
    if (!user?.is_admin && !user?.is_mod) {
      return NextResponse.json({ ok: false, error: 'Moderator access required' }, { status: 403 });
    }

    const db = await getDb();
    await db.collection('chat_messages').deleteOne({ id: messageId });

    // Broadcast deletion to all SSE clients so the message disappears in real-time
    const deletePayload = { type: 'delete', message_id: messageId };
    chatBus.emit('moderation', deletePayload);
    relayToOtherWorkers('moderation', deletePayload); // Cross-worker relay

    return NextResponse.json({ ok: true, deleted: messageId });
  } catch (error) {
    console.error('Chat DELETE error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
