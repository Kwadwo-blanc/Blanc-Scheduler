import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  RotateCcw, 
  FolderKanban, 
  BookOpen, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'calendar' 
  | 'continuity' 
  | 'projects' 
  | 'materials' 
  | 'chat' 
  | 'analytics' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  activeResumeCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  activeResumeCount
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Scheduler', icon: CalendarDays },
    { 
      id: 'continuity', 
      label: 'Continuity Hub', 
      icon: RotateCcw, 
      badge: activeResumeCount > 0 ? `${activeResumeCount} Active` : undefined 
    },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'materials', label: 'Learning Materials', icon: BookOpen },
    { id: 'chat', label: 'Chat & Video Calls', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      id="main-sidebar"
      style={{
        width: 'var(--sidebar-width)',
        background: 'rgba(10, 15, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.25rem 0.75rem',
        gap: '0.35rem'
      }}
    >
      <div style={{ padding: '0.25rem 0.75rem 0.75rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Navigation
      </div>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => setCurrentTab(item.id as NavTab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: isActive 
                ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))' 
                : 'transparent',
              color: isActive ? 'var(--text-highlight)' : 'var(--text-muted)',
              borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon 
                size={18} 
                color={isActive ? 'var(--accent-primary)' : 'currentColor'} 
              />
              <span>{item.label}</span>
            </div>

            {item.badge && (
              <span 
                style={{
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 9999,
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#22d3ee',
                  fontWeight: 700,
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Continuity Motto Footer */}
      <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <Sparkles size={14} />
          <span>WORK CONTINUITY</span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          "Never lose track of where you stopped."
        </p>
      </div>
    </aside>
  );
};
