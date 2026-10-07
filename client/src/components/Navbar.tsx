import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Layers, 
  ChevronDown, 
  Bell, 
  UserCheck 
} from 'lucide-react';

interface NavbarProps {
  onOpenNewTask: () => void;
  onOpenAI: () => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewTask,
  onOpenAI,
  searchTerm,
  setSearchTerm
}) => {
  const { user, activeWorkspace, workspaces, setActiveWorkspace, switchPersona } = useAuth();

  return (
    <header 
      id="main-navbar" 
      style={{
        height: 'var(--header-height)',
        background: 'rgba(8, 11, 18, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Brand & Workspace */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div 
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>C</span>
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CONTINUUM
            </span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        {workspaces.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select
              id="workspace-select"
              value={activeWorkspace?.id || ''}
              onChange={(e) => {
                const found = workspaces.find(w => w.id === e.target.value);
                if (found) setActiveWorkspace(found);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.4rem 2rem 0.4rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none'
              }}
            >
              {workspaces.map(ws => (
                <option key={ws.id} value={ws.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {/* Center Search */}
      <div style={{ flex: '0 1 360px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        <input
          id="global-search-input"
          type="text"
          placeholder="Search scheduled tasks, resume points, notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.45rem 1rem 0.45rem 2.2rem',
            color: 'var(--text-main)',
            fontSize: '0.85rem'
          }}
        />
      </div>

      {/* Right Actions & Persona Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Quick Persona Switcher for testing */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', padding: '2px 4px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '0 6px', fontWeight: 600 }}>PERSONA:</span>
          <button
            id="switch-student"
            className="btn"
            onClick={() => switchPersona('alex.student@continuum.dev')}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              background: user?.email.includes('alex') ? 'var(--accent-primary)' : 'transparent',
              color: user?.email.includes('alex') ? '#fff' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Switch to Student persona (Alex Rivers)"
          >
            Student
          </button>
          <button
            id="switch-developer"
            className="btn"
            onClick={() => switchPersona('dev.sam@continuum.dev')}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              background: user?.email.includes('dev.sam') ? 'var(--accent-emerald)' : 'transparent',
              color: user?.email.includes('dev.sam') ? '#fff' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Switch to Developer persona (Sam Chen)"
          >
            Developer
          </button>
          <button
            id="switch-teamlead"
            className="btn"
            onClick={() => switchPersona('sarah.lead@continuum.dev')}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              background: user?.email.includes('sarah') ? 'var(--accent-purple)' : 'transparent',
              color: user?.email.includes('sarah') ? '#fff' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Switch to Team Lead persona (Sarah Miller)"
          >
            Team Lead
          </button>
        </div>

        {/* AI Assistant Button */}
        <button
          id="navbar-ai-assistant-btn"
          className="btn btn-secondary"
          onClick={onOpenAI}
          style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
        >
          <Sparkles size={16} color="var(--accent-primary)" />
          <span>Ask AI</span>
        </button>

        {/* Schedule Task Button */}
        <button
          id="navbar-schedule-task-btn"
          className="btn btn-primary"
          onClick={onOpenNewTask}
        >
          <Plus size={16} />
          <span>Schedule Task</span>
        </button>

        {/* User Avatar */}
        {user && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              paddingLeft: '0.5rem',
              borderLeft: '1px solid var(--border-subtle)' 
            }}
          >
            <img 
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
              alt={user.full_name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent-primary)' }}
            />
            <div style={{ display: 'none', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.full_name}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
