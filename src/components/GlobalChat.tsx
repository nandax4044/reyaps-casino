import React, { useState, useEffect, useRef } from 'react';
import { API } from '../utils/api';
import { MessageCircle, Send, Trash2, Ban, Shield, Radio, AlertCircle, Crown, Star, User as UserIcon } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  is_staff: boolean;
  message: string;
  timestamp: string;
}

interface GlobalChatProps {
  currentUser: {
    id: string;
    username: string;
    is_staff: boolean;
  };
}

export function GlobalChat({ currentUser }: GlobalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const lastMessageCountRef = useRef(0);

  // Scroll to bottom only on initial load
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll on initial load when messages first appear
    if (messages.length > 0 && lastMessageCountRef.current === 0) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    if (inputMessage.trim().length > 200) {
      setError('Pesan maksimal 200 karakter!');
      return;
    }

    setError('');
    setSending(true);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ message: inputMessage.trim() })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim pesan');
      }

      // Add message to local state immediately for instant feedback
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      
      setInputMessage('');
      // Don't auto-scroll after sending message
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get role badge with icon
  const getRoleBadge = (is_staff: boolean, username: string) => {
    if (username === 'nanddev') {
      return (
        <span className="flex items-center gap-1 text-[7px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-black border border-red-500/30">
          <Crown className="w-2.5 h-2.5" />
          OWNER
        </span>
      );
    }
    if (is_staff) {
      return (
        <span className="flex items-center gap-1 text-[7px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-mono font-black border border-yellow-500/30">
          <Shield className="w-2.5 h-2.5" />
          STAFF
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[7px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-black border border-blue-500/30">
        <UserIcon className="w-2.5 h-2.5" />
        PLAYER
      </span>
    );
  };

  // Get username color
  const getUsernameColor = (is_staff: boolean, username: string) => {
    if (username === 'nanddev') return 'text-red-400';
    if (is_staff) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  return (
    <div className="glass-panel-dark rounded-2xl border border-cyan-500/20 p-3 shadow-xl relative overflow-hidden backdrop-blur-md flex flex-col h-full max-h-[450px]">
      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
      
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-slate-950 animate-pulse" />
          </div>
          <div>
            <h3 className="text-[10px] font-display font-black text-white uppercase tracking-wider flex items-center gap-1">
              Global Chat
              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-1.5 h-1.5" /> LIVE
              </span>
            </h3>
            <p className="text-[8px] text-slate-400 font-mono">
              {messages.length} pesan
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-2 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-500 font-mono text-[9px]">
            <MessageCircle className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>Memuat chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 py-6 font-mono text-[9px]">
            Belum ada pesan
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUser.id;
            const isNanddev = msg.username === 'nanddev';
            
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
              >
                {/* Username and badge */}
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-bold ${getUsernameColor(msg.is_staff, msg.username)}`}>
                    {msg.username}
                  </span>
                  {isNanddev ? (
                    <Crown className="w-2 h-2 text-red-400" />
                  ) : msg.is_staff && (
                    <Shield className="w-2 h-2 text-yellow-400" />
                  )}
                  <span className="text-[7px] text-slate-500 font-mono">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                
                {/* Message bubble */}
                <div 
                  className={`max-w-[90%] px-2 py-1 rounded-lg text-[9px] leading-relaxed ${
                    isOwn 
                      ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100'
                      : isNanddev
                      ? 'bg-red-950/30 border border-red-500/30 text-red-100'
                      : msg.is_staff
                      ? 'bg-yellow-950/20 border border-yellow-500/20 text-yellow-100'
                      : 'bg-slate-900/50 border border-white/10 text-slate-200'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-2 py-1 px-2 bg-red-950/40 border border-red-500/30 text-[9px] text-red-400 rounded-lg flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-1.5">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ketik pesan..."
          maxLength={200}
          disabled={sending}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-2.5 text-[9px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !inputMessage.trim()}
          className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all flex items-center gap-1 text-[9px] font-bold disabled:cursor-not-allowed"
        >
          <Send className="w-2.5 h-2.5" />
        </button>
      </form>

      {/* Character counter */}
      <div className="mt-1 text-right">
        <span className={`text-[7px] font-mono ${
          inputMessage.length > 180 ? 'text-red-400' : 'text-slate-500'
        }`}>
          {inputMessage.length}/200
        </span>
      </div>
    </div>
  );
}
