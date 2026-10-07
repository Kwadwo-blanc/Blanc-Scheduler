import React from 'react';
import { NavTab } from './Sidebar';
import { 
  LayoutDashboard, 
  CalendarDays, 
  RotateCcw, 
  Sparkles, 
  MoreHorizontal 
} from 'lucide-react';
import { mobileBridge } from '../services/mobileBridge';

interface MobileBottomNavProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  activeResumeCount: number;
  onOpenAI: () => void;
  onOpenMoreSheet: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  activeResumeCount,
  onOpenAI,
  onOpenMoreSheet
}) => {
  const handleTabClick = (tab: NavTab) => {
    mobileBridge.triggerHaptic('light');
    setCurrentTab(tab);
  };

  const handleAIClick = () => {
    mobileBridge.triggerHaptic('medium');
    onOpenAI();
  };

  const handleMoreClick = () => {
    mobileBridge.triggerHaptic('light');
    onOpenMoreSheet();
  };

  const isMoreActive = ['projects', 'materials', 'chat', 'analytics', 'settings'].includes(currentTab);

  return (
    <nav 
      id="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(8, 12, 22, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 900
      }}
    >
      {/* Home / Dashboard */}
      <button
        id="mobile-nav-dashboard"
        onClick={() => handleTabClick('dashboard')}
        style={{
          background: 'transparent',
          color: currentTab === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '6px 12px',
          fontSize: '0.68rem',
          fontWeight: currentTab === 'dashboard' ? 700 : 500
        }}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </button>

      {/* Scheduler */}
      <button
        id="mobile-nav-calendar"
        onClick={() => handleTabClick('calendar')}
        style={{
          background: 'transparent',
          color: currentTab === 'calendar' ? 'var(--accent-primary)' : 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '6px 12px',
          fontSize: '0.68rem',
          fontWeight: currentTab === 'calendar' ? 700 : 500
        }}
      >
        <CalendarDays size={20} />
        <span>Schedule</span>
      </button>

      {/* Center AI Pill */}
      <button
        id="mobile-nav-ai"
        onClick={handleAIClick}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          boxShadow: 'var(--shadow-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -16,
          color: '#fff',
          border: '3px solid #080c16'
        }}
        title="Continuum AI Assistant"
      >
        <Sparkles size={20} />
      </button>

      {/* Continuity Hub */}
      <button
        id="mobile-nav-continuity"
        onClick={() => handleTabClick('continuity')}
        style={{
          background: 'transparent',
          color: currentTab === 'continuity' ? 'var(--accent-secondary)' : 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '6px 12px',
          fontSize: '0.68rem',
          fontWeight: currentTab === 'continuity' ? 700 : 500,
          position: 'relative'
        }}
      >
        <RotateCcw size={20} />
        <span>Continuity</span>

        {activeResumeCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 14,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent-secondary)',
              boxShadow: '0 0 6px #06b6d4'
            }}
          />
        )}
      </button>

      {/* More / Menu */}
      <button
        id="mobile-nav-more"
        onClick={handleMoreClick}
        style={{
          background: 'transparent',
          color: isMoreActive ? 'var(--accent-primary)' : 'var(--text-dim)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '6px 12px',
          fontSize: '0.68rem',
          fontWeight: isMoreActive ? 700 : 500
        }}
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};
