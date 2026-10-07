import React, { useState, useEffect } from 'react';
import { ContinuityOverview, TaskWorkUnit, ResumePoint, Task } from '../types';
import { api } from '../services/api';
import { mobileBridge } from '../services/mobileBridge';
import { 
  X, 
  Play, 
  Pause, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Bookmark, 
  FileText, 
  Plus, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ContinuityDrawerProps {
  item: ContinuityOverview | null;
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const ContinuityDrawer: React.FC<ContinuityDrawerProps> = ({
  item,
  onClose,
  onTaskUpdated
}) => {
  if (!item) return null;

  const [task, setTask] = useState<Task>(item.task);
  const [resumePoint, setResumePoint] = useState<ResumePoint>(item.resumePoint);
  const [workUnits, setWorkUnits] = useState<TaskWorkUnit[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [stoppingNote, setStoppingNote] = useState<string>('');
  const [newUnitTitle, setNewUnitTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch full details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await api.getTask(item.task.id);
        setTask(data.task);
        setWorkUnits(data.workUnits);
        if (data.resumePoint) setResumePoint(data.resumePoint);

        // Start continuity session
        const sessionRes = await api.startSession(item.task.id);
        setSessionId(sessionRes.session.id);
        setIsRunning(true);
      } catch (err) {
        console.error('Error starting session:', err);
      }
    };

    fetchDetails();
  }, [item.task.id]);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleUnit = async (unit: TaskWorkUnit) => {
    const newStatus = unit.status === 'completed' ? 'pending' : 'completed';
    mobileBridge.triggerHaptic(newStatus === 'completed' ? 'success' : 'light');
    try {
      const res = await api.updateWorkUnit(task.id, unit.id, newStatus);
      if (res.task) setTask(res.task);
      if (res.workUnits) setWorkUnits(res.workUnits);
      if (res.resumePoint) setResumePoint(res.resumePoint);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to toggle unit:', err);
    }
  };

  const handlePauseSession = async () => {
    if (!sessionId) return;
    mobileBridge.triggerHaptic('medium');
    setLoading(true);
    try {
      await api.pauseSession(sessionId, stoppingNote || undefined);
      setIsRunning(false);
      onTaskUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to pause session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;

    try {
      const res = await api.addWorkUnit(task.id, {
        title: newUnitTitle.trim(),
        unit_type: 'subtask',
        estimated_minutes: 15
      });
      setWorkUnits(res.workUnits);
      if (res.resumePoint) setResumePoint(res.resumePoint);
      setNewUnitTitle('');
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to add work unit:', err);
    }
  };

  return (
    <div 
      id="continuity-drawer-overlay"
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        id="continuity-drawer-content"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 680,
          background: '#0d1322',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(6, 182, 212, 0.15)',
          padding: '2rem'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-in_progress">LIVE CONTINUITY SESSION</span>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>{task.title}</h2>
          </div>

          <button 
            id="close-continuity-drawer"
            className="btn-icon" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Timer & Checkpoint Banner */}
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.12))',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Current Focus Checkpoint
            </span>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
              {resumePoint?.checkpoint_title || 'Starting unit'}
            </div>
            {resumePoint?.stopping_context && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                Stored note: "{resumePoint.stopping_context}"
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-secondary)' }}>
              <Clock size={16} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700 }}>
                {formatTimer(secondsElapsed)}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Active Session Timer
            </span>
          </div>
        </div>

        {/* Work Units Progress Checklist */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Work Units & Sub-items</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                ({workUnits.filter(u => u.status === 'completed').length} of {workUnits.length} completed)
              </span>
            </h4>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
              {task.progress_pct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="progress-bar-container" style={{ marginBottom: '1rem' }}>
            <div className="progress-bar-fill" style={{ width: `${task.progress_pct}%` }} />
          </div>

          {/* Units List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto', paddingRight: '0.3rem' }}>
            {workUnits.map((unit) => {
              const isCompleted = unit.status === 'completed';
              const isInProgress = unit.status === 'in_progress';

              return (
                <div
                  key={unit.id}
                  id={`work-unit-row-${unit.id}`}
                  onClick={() => handleToggleUnit(unit)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isInProgress 
                      ? 'rgba(6, 182, 212, 0.15)' 
                      : (isCompleted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)'),
                    border: isInProgress 
                      ? '1px solid rgba(6, 182, 212, 0.4)' 
                      : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isCompleted ? (
                      <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    ) : (
                      <Circle size={18} color={isInProgress ? 'var(--accent-secondary)' : 'var(--text-dim)'} />
                    )}

                    <span 
                      style={{
                        fontSize: '0.875rem',
                        color: isCompleted ? 'var(--text-dim)' : 'var(--text-main)',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        fontWeight: isInProgress ? 600 : 400
                      }}
                    >
                      {unit.sequence_order}. {unit.title}
                    </span>
                  </div>

                  {isInProgress && (
                    <span 
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 9999,
                        background: 'rgba(6, 182, 212, 0.25)',
                        color: '#22d3ee',
                        fontWeight: 700
                      }}
                    >
                      RESUME POINT
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add unit inline */}
          <form onSubmit={handleAddUnit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <input
              id="new-work-unit-input"
              type="text"
              placeholder="+ Add next sub-task / exercise unit..."
              value={newUnitTitle}
              onChange={(e) => setNewUnitTitle(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 0.75rem',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.75rem' }}>
              <Plus size={15} />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Stopping Note & Pause Action */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
            Stopping Note for Continuity Engine (Optional):
          </label>
          <input
            id="stopping-context-input"
            type="text"
            placeholder="e.g. Completed through exercise 6. Got stuck on recursion base case."
            value={stoppingNote}
            onChange={(e) => setStoppingNote(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.55rem 0.85rem',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              id="pause-continuity-session-btn"
              className="btn btn-secondary"
              onClick={handlePauseSession}
              disabled={loading}
              style={{ borderColor: 'var(--accent-amber)', color: '#fbbf24' }}
            >
              <Pause size={16} />
              <span>Pause & Record Checkpoint</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
