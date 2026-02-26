'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Trash2, MessageCircle, Crown, Shield, Zap, Users, X, Minimize2, Maximize2 } from 'lucide-react';

// Tier badge configuration
const TIER_CONFIG = {
  engineer: { icon: Crown, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Engineer' },
  conductor: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Conductor' },
  fireman: { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Fireman' },
  guest: { icon: Users, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Guest' },
};

function TierBadge({ tier }) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.guest;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}

function ChatMessage({ message, user, onDelete }) {
  const isOwnMessage = user?.username === message.username;
  const canDelete = user?.is_admin;
  const [showDelete, setShowDelete] = useState(false);

  // Format timestamp
  const time = new Date(message.created_at);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      className={`group flex gap-2 px-3 py-2 hover:bg-white/5 transition-colors ${isOwnMessage ? 'bg-orange-500/5' : ''}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-semibold text-sm ${isOwnMessage ? 'text-orange-400' : 'text-white'}`}>
            {message.username}
          </span>
          <TierBadge tier={message.tier} />
          <span className="text-xs text-gray-500">{timeStr}</span>
          
          {canDelete && showDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="ml-auto p-1 rounded hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete message"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-gray-300 text-sm break-words">{message.message}</p>
      </div>
    </div>
  );
}

export default function YardChat({ user, isMinimized = false, onToggleMinimize }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat?limit=50');
      const data = await res.json();
      
      if (data.ok) {
        setMessages(data.messages);
        setError(null);
        
        // Track unread when minimized
        if (isMinimized && data.messages.length > lastMessageCountRef.current) {
          setUnreadCount(prev => prev + (data.messages.length - lastMessageCountRef.current));
        }
        lastMessageCountRef.current = data.messages.length;
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  }, [isMinimized]);

  // Initial load and polling
  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll on new messages (only if not minimized)
  useEffect(() => {
    if (!isMinimized && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isMinimized, scrollToBottom]);

  // Clear unread when expanded
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to chat');
      return;
    }
    
    const trimmed = newMessage.trim();
    if (!trimmed || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: trimmed,
          user: {
            username: user.username,
            membership_tier: user.membership_tier,
            is_admin: user.is_admin,
            user_id: user.user_id,
          }
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setNewMessage('');
        // Add message immediately for responsiveness
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      } else {
        setError(data.error || 'Failed to send');
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Delete message (admin only)
  const handleDelete = async (messageId) => {
    if (!user?.is_admin) return;
    
    try {
      const res = await fetch(`/api/chat?id=${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Minimized view
  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
      >
        <MessageCircle className="w-5 h-5 text-orange-400" />
        <span className="font-medium text-white">Yard Chat</span>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
            {unreadCount}
          </span>
        )}
        <Maximize2 className="w-4 h-4 text-gray-400" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-orange-400" />
          <h3 className="font-bold text-white">Yard Chat</h3>
          <span className="text-xs text-gray-500">({messages.length} messages)</span>
        </div>
        {onToggleMinimize && (
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Minimize chat"
          >
            <Minimize2 className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                user={user}
                onDelete={handleDelete}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/30">
        {user ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-gray-400 text-sm">
              <button className="text-orange-400 hover:underline font-medium">Sign in</button>
              {' '}to join the conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
