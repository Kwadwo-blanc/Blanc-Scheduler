import React from 'react';
import { NavTab } from './Sidebar';
import { 
  X, 
  FolderKanban, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Sparkles,
  Users,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mobileBridge } from '../services/mobileBridge';

interface MobileMoreSheetProps {
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ onClose, onSelectTab }) => {
  const { user, switchPersona } = useAuth();

  const handleSelect = (tab: NavTab) => {
    mobileBridge.triggerHaptic('light');
    onSelectTab(tab);
    onClose();
  };

  const handlePersonaSwitch = (email: string) => {
    mobileBridge.triggerHaptic('medium');
    switchPersona(email);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-end', padding: 0 }}>
      <div 
        id="mobile-more-sheet"
        className="fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '80vh',
          background: '#0d1322',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          borderTop: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
          overflowY: 'auto'
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 1.25rem auto' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Modules & Workspaces</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleSelect('projects')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', fontSize: '0.92rem' }}
          >
            <FolderKanban size={18} color="var(--accent-primary)" />
            <span>Projects & Milestones</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSelect('materials')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', fontSize: '0.92rem' }}
          >
            <BookOpen size={18} color="#60a5fa" />
            <span>Learning Materials & Textbooks</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSelect('chat')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', fontSize: '0.92rem' }}
          >
            <MessageSquare size={18} color="#34d399" />
            <span>Team Chat & Video Calls</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSelect('analytics')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', fontSize: '0.92rem' }}
          >
            <BarChart3 size={18} color="#fbbf24" />
            <span>Productivity Analytics</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleSelect('settings')}
            style={{ justifyContent: 'flex-start', padding: '0.85rem 1rem', fontSize: '0.92rem' }}
          >
            <Settings size={18} color="var(--text-muted)" />
            <span>Platform Settings</span>
          </button>
        </div>

        {/* Persona Switcher Section */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
            Switch Test Persona
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => handlePersonaSwitch('alex.student@continuum.dev')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: user?.email.includes('alex') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              <span>Alex Rivers (Student Persona)</span>
              {user?.email.includes('alex') && <Check size={16} color="var(--accent-primary)" />}
            </button>

            <button
              onClick={() => handlePersonaSwitch('dev.sam@continuum.dev')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: user?.email.includes('dev.sam') ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              <span>Sam Chen (Developer Persona)</span>
              {user?.email.includes('dev.sam') && <Check size={16} color="var(--accent-emerald)" />}
            </button>

            <button
              onClick={() => handlePersonaSwitch('sarah.lead@continuum.dev')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: user?.email.includes('sarah') ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              <span>Sarah Miller (Team Lead Persona)</span>
              {user?.email.includes('sarah') && <Check size={16} color="var(--accent-purple)" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
