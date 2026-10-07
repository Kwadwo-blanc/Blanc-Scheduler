import React, { useState, useEffect } from 'react';
import { ChatChannel, ChatMessage } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VideoCallModal } from './VideoCallModal';
import { 
  Send, 
  Video, 
  MessageSquare, 
  Hash, 
  Smile, 
  Paperclip, 
  Users 
} from 'lucide-react';

export const ChatView: React.FC = () => {
  const { user, activeWorkspace } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  useEffect(() => {
    if (activeWorkspace) {
      api.getChannels(activeWorkspace.id).then(res => {
        setChannels(res.channels);
        if (res.channels.length > 0) {
          setActiveChannel(res.channels[0]);
        }
      });
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (activeChannel) {
      api.getMessages(activeChannel.id).then(res => setMessages(res.messages));
    }
  }, [activeChannel?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !text.trim()) return;

    try {
      const res = await api.sendMessage(activeChannel.id, text.trim());
      setMessages(prev => [...prev, res.message]);
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div id="chat-view-container" style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '1.25rem' }}>
      {/* Channels Sidebar */}
      <div 
        className="glass-panel" 
        style={{
          width: 260,
          padding: '1.25rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}
      >
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', padding: '0 0.5rem 0.5rem 0.5rem' }}>
          Workspace Channels
        </span>

        {channels.map(c => (
          <button
            key={c.id}
            id={`channel-btn-${c.id}`}
            onClick={() => setActiveChannel(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              background: activeChannel?.id === c.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeChannel?.id === c.id ? '#fff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: activeChannel?.id === c.id ? 600 : 500
            }}
          >
            <Hash size={16} color={activeChannel?.id === c.id ? 'var(--accent-primary)' : 'currentColor'} />
            <span>{c.name}</span>
          </button>
        ))}
      </div>

      {/* Messages Pane */}
      <div 
        className="glass-panel" 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Channel Header */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Hash size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>
              {activeChannel?.name || 'Select a channel'}
            </span>
          </div>

          <button
            id="start-team-video-call-btn"
            className="btn btn-secondary"
            onClick={() => setShowVideoModal(true)}
            style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
          >
            <Video size={16} />
            <span>Start Video Meeting</span>
          </button>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m) => {
            const isMe = m.sender_id === user?.id;

            return (
              <div 
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}
              >
                <img 
                  src={m.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                  alt={m.sender_name || 'User'} 
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.sender_name || 'Team Member'}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div 
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.9rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-main)',
                      display: 'inline-block',
                      maxWidth: '85%'
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <form 
          onSubmit={handleSendMessage}
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <input
            id="chat-message-input"
            type="text"
            placeholder={`Message #${activeChannel?.name || 'channel'}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem'
            }}
          />

          <button 
            id="chat-send-btn"
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </form>
      </div>

      {showVideoModal && (
        <VideoCallModal 
          channelName={activeChannel?.name || 'General Meeting'} 
          onClose={() => setShowVideoModal(false)} 
        />
      )}
    </div>
  );
};
