'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageCircle, Send, Users, X, ExternalLink, Hash, ChevronDown,
  Shield, ShieldCheck, Crown, Pin, Trash2, VolumeX, Ban, MoreHorizontal,
  Radio, ChevronRight, PanelRightOpen,
} from 'lucide-react';

// ── Tier badge component ──
function TierBadge({ tier, isAdmin, isMod, size = 'sm' }) {
  if (isAdmin) return <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 ${size === 'xs' ? 'text-[9px] px-1' : ''}`}><Crown className="w-2.5 h-2.5" />ADMIN</span>;
  if (isMod) return <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 ${size === 'xs' ? 'text-[9px] px-1' : ''}`}><ShieldCheck className="w-2.5 h-2.5" />MOD</span>;
  const colors = {
    engineer: 'bg-[#ff7a00]/20 text-[#ff7a00]',
    conductor: 'bg-purple-500/20 text-purple-400',
    fireman: 'bg-green-500/20 text-green-400',
  };
  const label = tier?.charAt(0).toUpperCase() + tier?.slice(1) || 'Guest';
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[tier] || 'bg-zinc-700 text-zinc-400'} ${size === 'xs' ? 'text-[9px] px-1' : ''}`}>{label}</span>;
}

// Quick emoji set for reactions
const REACTION_EMOJIS = ['🚂', '👍', '🔥', '❤️', '👀', '🎉'];

// ── Message component ──
function ChatMessage({ msg, currentUser, onDelete, onMute, onBan, onReact }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactPicker, setShowReactPicker] = useState(false);
  const isOwn = msg.username === currentUser?.username;
  const canModerate = currentUser?.is_admin || currentUser?.is_mod;
  const reactions = msg.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  if (msg.is_system) {
    return (
      <div className="flex justify-center py-1.5 px-3">
        <span className="text-[11px] text-yellow-500/70 bg-yellow-500/5 px-3 py-1 rounded-full italic">
          {msg.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`group flex gap-2 px-3 py-1.5 hover:bg-white/[0.02] transition-colors ${msg.pinned ? 'bg-[#ff7a00]/5 border-l-2 border-[#ff7a00]/40' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5 ${
        msg.is_admin ? 'bg-red-500/20 text-red-400' : msg.is_mod ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-700 text-zinc-300'
      }`}>
        {msg.username.charAt(0).toUpperCase()}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-sm font-semibold ${isOwn ? 'text-[#ff7a00]' : msg.is_admin ? 'text-red-400' : 'text-white'}`}>
            {msg.username}
          </span>
          <TierBadge tier={msg.tier} isAdmin={msg.is_admin} isMod={msg.is_mod} size="xs" />
          {msg.pinned && <Pin className="w-3 h-3 text-[#ff7a00]" />}
          <span className="text-[10px] text-white/30">{formatTime(msg.created_at)}</span>
        </div>
        <p className="text-sm text-white/80 break-words leading-relaxed">{msg.message}</p>
        {/* Reactions display */}
        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => {
              const iReacted = users.includes(currentUser?.username);
              return (
                <button
                  key={emoji}
                  onClick={() => onReact && onReact(msg.id, emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] transition-all ${
                    iReacted
                      ? 'bg-[#ff7a00]/15 border border-[#ff7a00]/30 text-[#ff7a00]'
                      : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  title={users.join(', ')}
                >
                  <span>{emoji}</span>
                  <span className="font-semibold">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {/* Quick react + mod actions */}
      <div className="relative flex-shrink-0 flex items-start gap-0.5">
        {/* Quick react button */}
        {currentUser && !msg.is_system && (
          <div className="relative">
            <button
              onClick={() => setShowReactPicker(!showReactPicker)}
              className="p-1 text-white/10 hover:text-white/40 opacity-0 group-hover:opacity-100 transition text-[13px]"
              title="React"
            >
              😀
            </button>
            {showReactPicker && (
              <div
                className="absolute right-0 top-6 z-50 bg-zinc-800 border border-white/10 rounded-lg shadow-xl p-1.5 flex gap-0.5"
                onMouseLeave={() => setShowReactPicker(false)}
              >
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onReact && onReact(msg.id, emoji); setShowReactPicker(false); }}
                    className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-base transition-transform hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Mod actions menu */}
        {canModerate && !isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-white/20 hover:text-white/60 opacity-0 group-hover:opacity-100 transition"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 z-50 bg-zinc-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]"
                onMouseLeave={() => setShowMenu(false)}>
                <button onClick={() => { onDelete(msg.id); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button onClick={() => { onMute(msg.username, 5); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/10">
                  <VolumeX className="w-3 h-3" /> Mute 5 min
                </button>
                <button onClick={() => { onMute(msg.username, 60); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/10">
                  <VolumeX className="w-3 h-3" /> Mute 1 hour
                </button>
                <button onClick={() => { onBan(msg.username); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10">
                  <Ban className="w-3 h-3" /> Ban
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

// ── Main YardChat component ──
export default function YardChat({ user, selectedCameras = [], isPopout = false, onClose, onPopout, onDock }) {
  const [activeRoom, setActiveRoom] = useState('the-yard');
  const [rooms, setRooms] = useState([{ id: 'the-yard', name: 'The Yard', type: 'global', online_count: 0, online_users: [], pinned_message: null }]);
  const [joinedRooms, setJoinedRooms] = useState(['the-yard']);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [showOnline, setShowOnline] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const lastFetchRef = useRef({});
  const scrollContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  }, []);

  // Auto-scroll to bottom when new messages arrive (only if user is at bottom)
  const scrollToBottom = useCallback(() => {
    if (isAtBottomRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // ── Auto-join camera rooms based on what's being watched ──
  useEffect(() => {
    const cameraRooms = selectedCameras
      .filter(Boolean)
      .map(cam => ({
        id: `cam-${cam._id}`,
        name: cam.location || cam.name,
        type: 'camera',
        camera_id: cam._id,
      }));

    // Ensure camera rooms exist on the server
    cameraRooms.forEach(room => {
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensure_room', room_id: room.id, name: room.name, type: 'camera', camera_id: room.camera_id }),
      }).catch(() => {});
    });

    setJoinedRooms(prev => {
      const newRooms = new Set(prev);
      newRooms.add('the-yard'); // Always in The Yard
      cameraRooms.forEach(r => newRooms.add(r.id));
      // Remove camera rooms we're no longer watching (but keep manually joined ones)
      const watchingIds = new Set(cameraRooms.map(r => r.id));
      prev.forEach(rid => {
        if (rid.startsWith('cam-') && !watchingIds.has(rid)) {
          newRooms.delete(rid);
        }
      });
      return [...newRooms];
    });
  }, [selectedCameras]);

  // ── Fetch rooms list ──
  const fetchRoomsRef = useRef(null);
  useEffect(() => {
    const fetchRooms = () => {
      fetch('/api/chat?action=rooms')
        .then(r => r.json())
        .then(data => {
          if (data.ok && data.rooms) {
            // Merge server rooms with auto-joined camera rooms
            const serverRooms = data.rooms;
            const cameraRooms = selectedCameras.filter(Boolean).map(cam => ({
              id: `cam-${cam._id}`,
              name: cam.location || cam.name,
              type: 'camera',
              camera_id: cam._id,
              online_count: 0,
              online_users: [],
              pinned_message: null,
            }));
            // Merge: server data takes priority
            const roomMap = {};
            [...cameraRooms, ...serverRooms].forEach(r => { roomMap[r.id] = r; });
            // Always ensure The Yard is present
            if (!roomMap['the-yard']) {
              roomMap['the-yard'] = { id: 'the-yard', name: 'The Yard', type: 'global', online_count: 0, online_users: [], pinned_message: null };
            }
            setRooms(Object.values(roomMap));
          }
        })
        .catch(() => {});
    };
    fetchRoomsRef.current = fetchRooms;
    fetchRooms();
    const interval = setInterval(fetchRooms, 8000); // Poll rooms every 8s for responsive online count
    return () => clearInterval(interval);
  }, [selectedCameras]);

  // ── Poll messages for active room ──
  useEffect(() => {
    if (!activeRoom) return;

    const fetchMessages = () => {
      const after = lastFetchRef.current[activeRoom];
      const url = after
        ? `/api/chat?action=messages&room=${activeRoom}&after=${encodeURIComponent(after)}`
        : `/api/chat?action=messages&room=${activeRoom}&limit=50`;

      fetch(url)
        .then(r => r.json())
        .then(data => {
          if (data.ok && data.messages?.length > 0) {
            setMessages(prev => {
              const existing = prev[activeRoom] || [];
              const existingIds = new Set(existing.map(m => m.id));
              const newMsgs = data.messages.filter(m => !existingIds.has(m.id));
              if (newMsgs.length === 0) return prev;
              const merged = [...existing, ...newMsgs].slice(-200); // Keep last 200
              return { ...prev, [activeRoom]: merged };
            });
            const lastMsg = data.messages[data.messages.length - 1];
            if (lastMsg) lastFetchRef.current[activeRoom] = lastMsg.created_at;
            setTimeout(scrollToBottom, 100);
            // Also refresh rooms to update online count (new messages = someone is active)
            if (fetchRoomsRef.current) fetchRoomsRef.current();
          }
        })
        .catch(() => {});
    };

    // Initial fetch (full history)
    if (!lastFetchRef.current[activeRoom]) {
      fetchMessages();
    }

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeRoom, scrollToBottom]);

  // ── Presence heartbeat (robust: interval + visibilitychange) ──
  const sendPresenceRef = useRef(null);
  useEffect(() => {
    if (!user?.username) return;

    const sendPresence = () => {
      joinedRooms.forEach(roomId => {
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'presence', user, room_id: roomId }),
        }).then(r => {
          if (!r.ok) console.warn('[YardChat] Presence heartbeat failed:', r.status);
        }).catch(err => console.warn('[YardChat] Presence heartbeat error:', err.message));
      });
    };
    sendPresenceRef.current = sendPresence;

    // Fire immediately
    sendPresence();
    // Fire on regular interval
    const interval = setInterval(sendPresence, 30000); // Every 30 seconds

    // Fire immediately when tab becomes visible again (browser throttles timers in background tabs)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, joinedRooms]);

  // ── Send message ──
  const handleSend = async () => {
    if (!input.trim() || !user?.username || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', message: input.trim(), user, room_id: activeRoom }),
      });
      const data = await res.json();
      if (data.ok && data.message) {
        setMessages(prev => {
          const existing = prev[activeRoom] || [];
          return { ...prev, [activeRoom]: [...existing, data.message].slice(-200) };
        });
        lastFetchRef.current[activeRoom] = data.message.created_at;
        setInput('');
        isAtBottomRef.current = true;
        setTimeout(scrollToBottom, 50);
      } else if (data.error) {
        // Show mute/ban error inline
        setMessages(prev => {
          const existing = prev[activeRoom] || [];
          return { ...prev, [activeRoom]: [...existing, { id: 'err-' + Date.now(), is_system: true, message: data.error, created_at: new Date().toISOString() }] };
        });
      }
    } catch {}
    setSending(false);
  };

  // ── Mod actions ──
  const handleDelete = async (messageId) => {
    await fetch(`/api/chat?id=${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    setMessages(prev => ({
      ...prev,
      [activeRoom]: (prev[activeRoom] || []).filter(m => m.id !== messageId),
    }));
  };

  const handleMute = async (username, minutes) => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'moderate', user, target_username: username, type: 'mute', room_id: activeRoom, duration_minutes: minutes }),
    });
  };

  const handleBan = async (username) => {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'moderate', user, target_username: username, type: 'ban', room_id: '*' }),
    });
  };

  // ── React to a message (toggle emoji) ──
  const handleReact = async (messageId, emoji) => {
    if (!user?.username) return;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'react', user, message_id: messageId, emoji }),
      });
      const data = await res.json();
      if (data.ok) {
        // Update the message reactions locally
        setMessages(prev => {
          const roomMsgs = prev[activeRoom] || [];
          return {
            ...prev,
            [activeRoom]: roomMsgs.map(m =>
              m.id === messageId ? { ...m, reactions: data.reactions } : m
            ),
          };
        });
      }
    } catch (e) {
      console.error('Failed to react:', e);
    }
  };

  // ── Join a room from browse ──
  const handleJoinRoom = (roomId) => {
    if (!joinedRooms.includes(roomId)) {
      setJoinedRooms(prev => [...prev, roomId]);
    }
    setActiveRoom(roomId);
    setShowBrowse(false);
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom) || { name: 'The Yard', online_count: 0, online_users: [], pinned_message: null };
  const activeMessages = messages[activeRoom] || [];
  const visibleRooms = rooms.filter(r => joinedRooms.includes(r.id));

  // Boost online count for rooms the user has joined (always count self)
  const roomsWithSelf = useMemo(() => {
    if (!user?.username) return rooms;
    return rooms.map(r => {
      if (joinedRooms.includes(r.id)) {
        const alreadyCounted = (r.online_users || []).some(u => u.username === user.username);
        if (!alreadyCounted) {
          return { ...r, online_count: (r.online_count || 0) + 1 };
        }
      }
      return r;
    });
  }, [rooms, joinedRooms, user]);

  const visibleRoomsWithSelf = roomsWithSelf.filter(r => joinedRooms.includes(r.id));

  // Merge server online users with self (always show yourself as online if logged in)
  const mergedOnlineUsers = useMemo(() => {
    const serverUsers = activeRoomData.online_users || [];
    const merged = {};
    serverUsers.forEach(u => { merged[u.username] = u; });
    if (user?.username && !merged[user.username]) {
      merged[user.username] = { username: user.username, tier: user.membership_tier || 'guest', is_admin: user.is_admin || false, is_mod: user.is_mod || false };
    }
    return Object.values(merged);
  }, [activeRoomData.online_users, user]);

  const onlineCount = Math.max(activeRoomData.online_count, mergedOnlineUsers.length);

  return (
    <div className={`flex flex-col bg-zinc-900/95 ${isPopout ? 'h-screen' : 'h-full'} border-l border-white/5 relative`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-800/80 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#ff7a00]" />
          <span className="text-sm font-bold text-white">The Yard</span>
          <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">
            {onlineCount} online
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowOnline(!showOnline)} className="p-1.5 text-white/50 hover:text-white/80 transition" title="Who's Online">
            <Users className="w-4 h-4" />
          </button>
          {isPopout && onDock && (
            <button onClick={onDock} className="p-1.5 text-white/50 hover:text-[#ff7a00] transition" title="Dock Chat Back">
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
          {!isPopout && onPopout && (
            <button onClick={onPopout} className="p-1.5 text-white/50 hover:text-white/80 transition" title="Pop Out Chat">
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1.5 text-white/50 hover:text-white/80 transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Room tabs ── */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-zinc-800/40 border-b border-white/5 overflow-x-auto scrollbar-none">
        {visibleRoomsWithSelf.map(room => (
          <button
            key={room.id}
            onClick={() => setActiveRoom(room.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              activeRoom === room.id
                ? 'bg-[#ff7a00]/20 text-[#ff7a00] border border-[#ff7a00]/30'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {room.type === 'global' ? <Radio className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
            {room.name}
            {room.online_count > 0 && (
              <span className="text-[9px] bg-white/10 px-1 rounded">{room.online_count}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setShowBrowse(!showBrowse)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition"
        >
          <ChevronRight className="w-3 h-3" /> Browse
        </button>
      </div>

      {/* ── Browse rooms dropdown ── */}
      {showBrowse && (
        <div className="bg-zinc-800 border-b border-white/10 max-h-48 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">All Active Rooms</div>
          {roomsWithSelf.map(room => (
            <button
              key={room.id}
              onClick={() => handleJoinRoom(room.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-white/5 transition ${
                joinedRooms.includes(room.id) ? 'text-[#ff7a00]' : 'text-white/70'
              }`}
            >
              <span className="flex items-center gap-2">
                {room.type === 'global' ? <Radio className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                {room.name}
              </span>
              <span className="text-[10px] text-white/40">{room.online_count} online</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Who's Online panel ── */}
      {showOnline && (
        <div className="bg-zinc-800 border-b border-white/10 max-h-48 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold text-white/40 uppercase tracking-wider">
            Online in {activeRoomData.name} ({onlineCount})
          </div>
          {mergedOnlineUsers.map((u, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-white/80">{u.username}</span>
              <TierBadge tier={u.tier} isAdmin={u.is_admin} isMod={u.is_mod} size="xs" />
            </div>
          ))}
          {mergedOnlineUsers.length === 0 && (
            <div className="px-3 py-3 text-xs text-white/30 text-center">No one else here yet</div>
          )}
        </div>
      )}

      {/* ── Pinned message ── */}
      {activeRoomData.pinned_message && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#ff7a00]/5 border-b border-[#ff7a00]/10">
          <Pin className="w-3 h-3 text-[#ff7a00] flex-shrink-0" />
          <span className="text-xs text-[#ff7a00]/80 truncate">{activeRoomData.pinned_message}</span>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden py-2"
      >
        {activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
            <MessageCircle className="w-8 h-8" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Be the first to say something!</p>
          </div>
        ) : (
          activeMessages.map(msg => (
            <ChatMessage
              key={msg.id}
              msg={msg}
              currentUser={user}
              onDelete={handleDelete}
              onMute={handleMute}
              onBan={handleBan}
              onReact={handleReact}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Scroll to bottom indicator ── */}
      {!isAtBottomRef.current && activeMessages.length > 10 && (
        <button
          onClick={() => { isAtBottomRef.current = true; messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#ff7a00] text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-[#ff8c20] transition z-10"
        >
          <ChevronDown className="w-3 h-3 inline mr-1" />New messages
        </button>
      )}

      {/* ── Input ── */}
      {user ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 px-3 py-2.5 bg-zinc-800/80 border-t border-white/5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${activeRoomData.name}...`}
            maxLength={500}
            className="flex-1 bg-zinc-700/50 text-white text-sm rounded-lg px-3 py-2 border border-white/5 focus:border-[#ff7a00]/50 focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/20 placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-[#ff7a00] hover:bg-[#ff8c20] text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="px-3 py-3 bg-zinc-800/80 border-t border-white/5 text-center">
          <p className="text-xs text-white/40">Sign in to chat</p>
        </div>
      )}
    </div>
  );
}
