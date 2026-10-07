import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';
import { ContinuityOverview, Task } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { ContinueSection } from './components/ContinueSection';
import { ContinuityDrawer } from './components/ContinuityDrawer';
import { CalendarView } from './components/CalendarView';
import { ProjectsView } from './components/ProjectsView';
import { MaterialsView } from './components/MaterialsView';
import { ChatView } from './components/ChatView';
import { AnalyticsView } from './components/AnalyticsView';
import { AIAssistantModal } from './components/AIAssistantModal';
import { TaskModal } from './components/TaskModal';
import { OverrideModal } from './components/OverrideModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMoreSheet } from './components/MobileMoreSheet';
import { mobileBridge } from './services/mobileBridge';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  AlertCircle,
  Play
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, activeWorkspace, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [resumePoints, setResumePoints] = useState<ContinuityOverview[]>([]);
  const [activeTaskDrawer, setActiveTaskDrawer] = useState<ContinuityOverview | null>(null);
  const [overrideItem, setOverrideItem] = useState<ContinuityOverview | null>(null);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [showMobileMore, setShowMobileMore] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    mobileBridge.initialize();
  }, []);

  const loadContinuityData = async () => {
    try {
      const res = await api.getResumePoints(activeWorkspace?.id);
      setResumePoints(res.resumePoints);
    } catch (err) {
      console.error('Error fetching resume points:', err);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      loadContinuityData();
    }
  }, [activeWorkspace?.id, refreshTrigger, user?.id]);

  const handleSelectTaskById = async (taskId: string) => {
    try {
      const data = await api.getTask(taskId);
      const overview: ContinuityOverview = {
        task: data.task,
        resumePoint: data.resumePoint,
        completedUnitsCount: data.workUnits.filter(u => u.status === 'completed').length,
        totalUnitsCount: data.workUnits.length
      };
      setActiveTaskDrawer(overview);
    } catch (err) {
      console.error('Error opening task:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff' }}>C</span>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Initializing Continuum Platform...</span>
        </div>
      </div>
    );
  }

  // Filter resume points if search is active
  const filteredResumePoints = resumePoints.filter(rp => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rp.task.title.toLowerCase().includes(term) ||
      rp.resumePoint.checkpoint_title.toLowerCase().includes(term) ||
      (rp.resumePoint.stopping_context && rp.resumePoint.stopping_context.toLowerCase().includes(term))
    );
  });

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeResumeCount={resumePoints.length}
      />

      <div className="main-wrapper">
        {/* Top Header Navbar */}
        <Navbar
          onOpenNewTask={() => setShowTaskModal(true)}
          onOpenAI={() => setShowAIModal(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Dynamic Content Views */}
        <main className="content-area">
          {currentTab === 'dashboard' && (
            <div>
              {/* Persona Greeting Banner */}
              <div 
                className="glass-panel" 
                style={{
                  padding: '1.75rem',
                  marginBottom: '2rem',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 69, 0.8))',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      WELCOME BACK, {user?.full_name?.toUpperCase() || 'USER'}
                    </span>
                    <span className={`badge badge-${user?.role || 'student'}`}>{user?.role}</span>
                  </div>
                  <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>
                    {resumePoints.length > 0 
                      ? `You have ${resumePoints.length} active resume ${resumePoints.length === 1 ? 'point' : 'points'} waiting.` 
                      : `Your schedule is primed. Ready to plan your next session?`}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {user?.role === 'student' 
                      ? 'Study Python Functions & Chapter 4 textbook references are checkpointed at Exercise 7.'
                      : (user?.role === 'developer'
                          ? 'JWT authentication middleware checkpoint is saved. Refresh tokens are queued up.'
                          : 'Sprint milestones are currently tracking at 72% overall delivery.')}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    id="hero-ask-ai-btn"
                    className="btn btn-secondary" 
                    onClick={() => setShowAIModal(true)}
                    style={{ borderColor: 'rgba(99, 102, 241, 0.4)', color: '#c7d2fe' }}
                  >
                    <Sparkles size={16} color="var(--accent-primary)" />
                    <span>AI Continuity Review</span>
                  </button>

                  {resumePoints.length > 0 && (
                    <button 
                      id="hero-quick-resume-btn"
                      className="btn btn-resume" 
                      onClick={() => setActiveTaskDrawer(resumePoints[0])}
                    >
                      <Play size={16} fill="white" />
                      <span>Resume Priority Task</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Core Feature: Continue Where You Left Off Deck */}
              <ContinueSection
                resumePoints={filteredResumePoints}
                onSelectTask={(item) => setActiveTaskDrawer(item)}
                onOpenOverride={(item) => setOverrideItem(item)}
              />

              {/* Quick Today's Schedule Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Today's Scheduled Sessions</h3>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setCurrentTab('calendar')}>
                      View Full Calendar
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {resumePoints.map(item => (
                      <div 
                        key={item.task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                              {item.task.scheduled_start.split('T')[1].slice(0, 5)} - {item.task.scheduled_end.split('T')[1].slice(0, 5)}
                            </span>
                            <span className={`badge badge-${item.task.category}`}>{item.task.category}</span>
                          </div>
                          <h4 style={{ fontSize: '0.95rem' }}>{item.task.title}</h4>
                        </div>

                        <button 
                          className="btn btn-secondary btn-icon" 
                          onClick={() => setActiveTaskDrawer(item)}
                          title="Open session timer"
                        >
                          <Play size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Continuity Insights Card */}
                <div 
                  className="glass-panel" 
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(99, 102, 241, 0.08))',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <Sparkles size={15} />
                      <span>CONTINUITY ADVISOR</span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                      Optimal Resumption Path
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      "You have high momentum on <strong>{resumePoints[0]?.task.title || 'your scheduled tasks'}</strong>. Pick up at <em>{resumePoints[0]?.resumePoint.checkpoint_title || 'first checkpoint'}</em> to complete before your deadline."
                    </p>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    style={{ marginTop: '1.25rem', width: '100%', fontSize: '0.8rem' }}
                    onClick={() => setShowAIModal(true)}
                  >
                    <span>Consult AI Assistant</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              onSelectTaskById={handleSelectTaskById}
              onOpenNewTask={() => setShowTaskModal(true)}
            />
          )}

          {currentTab === 'continuity' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.45rem', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  Work Continuity Hub
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Deterministic checkpoint engine tracking uncompleted work units, stopping notes, and next actions.
                </p>
              </div>
              <ContinueSection
                resumePoints={resumePoints}
                onSelectTask={(item) => setActiveTaskDrawer(item)}
                onOpenOverride={(item) => setOverrideItem(item)}
              />
            </div>
          )}

          {currentTab === 'projects' && <ProjectsView />}
          {currentTab === 'materials' && <MaterialsView />}
          {currentTab === 'chat' && <ChatView />}
          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'settings' && (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: 600 }}>
              <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Platform Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Logged in User:</label>
                  <div style={{ fontWeight: 600 }}>{user?.full_name} ({user?.email})</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Primary Role:</label>
                  <div className="badge badge-dev">{user?.role}</div>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Continuity Engine Mode:</label>
                  <div style={{ color: 'var(--accent-emerald)' }}>✓ Active Checkpointing (Zero Context Loss)</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Interactive Drawers & Modals */}
      {activeTaskDrawer && (
        <ContinuityDrawer
          item={activeTaskDrawer}
          onClose={() => setActiveTaskDrawer(null)}
          onTaskUpdated={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {overrideItem && (
        <OverrideModal
          item={overrideItem}
          onClose={() => setOverrideItem(null)}
          onUpdated={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {showAIModal && (
        <AIAssistantModal
          onClose={() => setShowAIModal(false)}
        />
      )}

      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeResumeCount={resumePoints.length}
        onOpenAI={() => setShowAIModal(true)}
        onOpenMoreSheet={() => setShowMobileMore(true)}
      />

      {/* Mobile More Sheet */}
      {showMobileMore && (
        <MobileMoreSheet
          onClose={() => setShowMobileMore(false)}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}
    </div>
  );
};
