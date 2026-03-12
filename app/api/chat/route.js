// The Yard Chat — Backend API
// Supports: rooms, messages, presence (who's online), moderation, pinned messages
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

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

// ── GET: Fetch messages, rooms, or presence ──
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'messages';
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
      // Get all rooms with online user counts
      const rooms = await db.collection('chat_rooms')
        .find({})
        .sort({ type: 1, name: 1 })
        .toArray();

      // Get online counts per room (active in last 60 seconds)
      const cutoff = new Date(Date.now() - 60000);
      const presenceCounts = await db.collection('chat_presence')
        .aggregate([
          { $match: { last_seen: { $gt: cutoff } } },
          { $group: { _id: '$room_id', count: { $sum: 1 }, users: { $push: { username: '$username', tier: '$tier', is_admin: '$is_admin', is_mod: '$is_mod' } } } },
        ])
        .toArray();

      const countMap = {};
      const usersMap = {};
      presenceCounts.forEach(p => {
        countMap[p._id] = p.count;
        usersMap[p._id] = p.users;
      });

      const formatted = rooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type, // 'global' | 'camera'
        camera_id: r.camera_id || null,
        online_count: countMap[r.id] || 0,
        online_users: usersMap[r.id] || [],
        pinned_message: r.pinned_message || null,
      }));

      return NextResponse.json({ ok: true, rooms: formatted });
    }

    // ── GET PRESENCE (who's online in a room) ──
    if (action === 'presence') {
      const room = searchParams.get('room') || 'the-yard';
      const cutoff = new Date(Date.now() - 60000);

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

    return NextResponse.json({ ok: true, deleted: messageId });
  } catch (error) {
    console.error('Chat DELETE error:', error);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
