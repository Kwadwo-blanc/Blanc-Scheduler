import React from 'react';
import { ContinuityOverview } from '../types';
import { 
  Play, 
  RotateCcw, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Bookmark, 
  Edit3 
} from 'lucide-react';

interface ContinueSectionProps {
  resumePoints: ContinuityOverview[];
  onSelectTask: (item: ContinuityOverview) => void;
  onOpenOverride: (item: ContinuityOverview) => void;
}

export const ContinueSection: React.FC<ContinueSectionProps> = ({
  resumePoints,
  onSelectTask,
  onOpenOverride
}) => {
  if (resumePoints.length === 0) {
    return (
      <div 
        id="continue-empty-state"
        className="glass-panel" 
        style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}
      >
        <RotateCcw size={32} color="var(--accent-secondary)" style={{ marginBottom: '0.75rem', opacity: 0.8 }} />
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>All Caught Up!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No paused tasks with pending checkpoints. Pick a scheduled task below or start a new focus session.
        </p>
      </div>
    );
  }

  return (
    <section id="continue-where-left-off-section" style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-secondary)', boxShadow: '0 0 10px #06b6d4' }}></span>
            <h2 style={{ fontSize: '1.45rem', letterSpacing: '-0.02em' }}>
              Continue Where You Left Off
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Your exact stopping points, active exercises, and next immediate actions preserved seamlessly.
          </p>
        </div>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', background: 'rgba(255, 255, 255, 0.04)', padding: '0.3rem 0.75rem', borderRadius: 9999, border: '1px solid var(--border-subtle)' }}>
          {resumePoints.length} Checkpointed {resumePoints.length === 1 ? 'Task' : 'Tasks'}
        </span>
      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {resumePoints.map((item) => {
          const { task, resumePoint, completedUnitsCount, totalUnitsCount } = item;

          return (
            <div 
              key={task.id}
              id={`resume-card-${task.id}`}
              className="glass-panel fade-in"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: '4px solid var(--accent-secondary)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className={`badge badge-${task.category}`}>
                      {task.category}
                    </span>
                    <span className={`badge badge-${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    {task.actual_minutes}m spent
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>
                  {task.title}
                </h3>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>Completion: {task.progress_pct}%</span>
                    <span>{completedUnitsCount} of {totalUnitsCount} sub-units done</span>
                  </div>
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${task.progress_pct}%` }} 
                    />
                  </div>
                </div>

                {/* Preserved Resume Point Box */}
                <div 
                  style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    marginBottom: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    <Bookmark size={13} />
                    <span>Exact Resume Point</span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '0.4rem' }}>
                    {resumePoint.checkpoint_title}
                  </div>

                  {resumePoint.stopping_context && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      "{resumePoint.stopping_context}"
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.8rem', color: '#38bdf8' }}>
                    <ArrowRight size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span><strong>Next Action:</strong> {resumePoint.next_recommended_action}</span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  id={`resume-btn-${task.id}`}
                  className="btn btn-resume"
                  onClick={() => onSelectTask(item)}
                  style={{ flex: 1 }}
                >
                  <Play size={16} fill="white" />
                  <span>Resume Now</span>
                </button>

                <button
                  id={`adjust-btn-${task.id}`}
                  className="btn btn-secondary btn-icon"
                  onClick={() => onOpenOverride(item)}
                  title="Manually adjust stopping point or note"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
