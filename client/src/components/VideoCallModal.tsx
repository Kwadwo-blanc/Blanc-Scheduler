import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  Users, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface VideoCallModalProps {
  onClose: () => void;
  channelName: string;
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({ onClose, channelName }) => {
  const { user } = useAuth();
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const sec = s % 60;
    return `${mins.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div id="video-call-modal" className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 820,
          background: '#070b14',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          height: '75vh'
        }}
      >
        {/* Call Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{channelName} — Collaborative Room</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
              {formatTime(seconds)}
            </span>
          </div>

          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Video Stage */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', minHeight: 0 }}>
          {/* User Tile */}
          <div 
            style={{
              background: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {videoOn ? (
              <img 
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'} 
                alt="Me" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
              />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}

            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
              {user?.full_name} (You) {!micOn && '🔇'}
            </div>
          </div>

          {/* Peer Tile */}
          <div 
            style={{
              background: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500" 
              alt="Peer" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
            />

            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
              Sam Chen (Active)
            </div>
          </div>
        </div>

        {/* Call Controls Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            id="call-toggle-mic"
            className="btn btn-secondary btn-icon" 
            style={{ width: 44, height: 44, borderRadius: '50%', background: micOn ? 'rgba(255,255,255,0.08)' : 'var(--accent-rose)', color: '#fff' }}
            onClick={() => setMicOn(!micOn)}
          >
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button 
            id="call-toggle-video"
            className="btn btn-secondary btn-icon" 
            style={{ width: 44, height: 44, borderRadius: '50%', background: videoOn ? 'rgba(255,255,255,0.08)' : 'var(--accent-rose)', color: '#fff' }}
            onClick={() => setVideoOn(!videoOn)}
          >
            {videoOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
          </button>

          <button 
            id="call-toggle-screenshare"
            className="btn btn-secondary btn-icon" 
            style={{ width: 44, height: 44, borderRadius: '50%', background: screenSharing ? 'var(--accent-secondary)' : 'rgba(255,255,255,0.08)', color: '#fff' }}
            onClick={() => setScreenSharing(!screenSharing)}
          >
            <Monitor size={20} />
          </button>

          <button 
            id="call-end-btn"
            className="btn btn-icon" 
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-rose)', color: '#fff' }}
            onClick={onClose}
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
