import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Plus, Trash2, Calendar, Clock } from 'lucide-react';

interface TaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ onClose, onTaskCreated }) => {
  const { activeWorkspace } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'study' | 'development' | 'work' | 'research' | 'personal'>('study');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [scheduledStart, setScheduledStart] = useState('2026-10-08T19:00');
  const [scheduledEnd, setScheduledEnd] = useState('2026-10-08T21:00');
  const [workUnits, setWorkUnits] = useState<{ title: string; unit_type: string; estimated_minutes: number }[]>([
    { title: 'Read introductory chapter & notes', unit_type: 'reading', estimated_minutes: 20 },
    { title: 'Complete practice exercises 1-5', unit_type: 'exercise', estimated_minutes: 40 }
  ]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAIBreakdown = async () => {
    if (!title.trim()) return;
    setLoadingAI(true);
    try {
      const res = await api.breakdownTaskWithAI(title.trim(), category, 120);
      setWorkUnits(res.workUnits);
    } catch (err) {
      console.error('Failed to breakdown task with AI:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAddUnit = () => {
    setWorkUnits([...workUnits, { title: '', unit_type: 'subtask', estimated_minutes: 15 }]);
  };

  const handleRemoveUnit = (idx: number) => {
    setWorkUnits(workUnits.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !title.trim()) return;

    setSubmitting(true);
    try {
      await api.createTask({
        workspace_id: activeWorkspace.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        scheduled_start: new Date(scheduledStart).toISOString(),
        scheduled_end: new Date(scheduledEnd).toISOString(),
        estimated_minutes: 120,
        work_units: workUnits.filter(u => u.title.trim())
      });
      onTaskCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="new-task-modal-overlay" className="modal-overlay" onClick={onClose}>
      <div 
        id="new-task-modal-content"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Schedule New Task & Checkpoint</h3>
          <button id="close-new-task-modal" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Task Title *
            </label>
            <input
              id="new-task-title-input"
              type="text"
              required
              placeholder="e.g. Study Python Data Structures: Heaps & Priority Queues"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.85rem',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Description & Learning Goals
            </label>
            <textarea
              id="new-task-desc-input"
              rows={2}
              placeholder="Details about textbook chapters or code specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.85rem',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Category & Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Category
              </label>
              <select
                id="new-task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.55rem 0.85rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="study">Study / Academic</option>
                <option value="development">Software Development</option>
                <option value="work">Work Assignment</option>
                <option value="research">Research</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Priority
              </label>
              <select
                id="new-task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.55rem 0.85rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Scheduled Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Start Time
              </label>
              <input
                id="new-task-start-input"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.55rem 0.85rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                End Time
              </label>
              <input
                id="new-task-end-input"
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.55rem 0.85rem',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Work Units Section with AI Breakdown */}
          <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Structured Work Units</span>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Enables granular stopping point and resume tracking.
                </p>
              </div>

              <button
                id="ai-breakdown-btn"
                type="button"
                className="btn btn-secondary"
                onClick={handleAIBreakdown}
                disabled={loadingAI || !title.trim()}
                style={{ fontSize: '0.75rem', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#a5b4fc' }}
              >
                <Sparkles size={13} color="var(--accent-primary)" />
                <span>{loadingAI ? 'Analyzing...' : 'AI Auto-Breakdown'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 180, overflowY: 'auto' }}>
              {workUnits.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: 18 }}>{i + 1}.</span>
                  <input
                    type="text"
                    value={u.title}
                    placeholder={`Sub-unit ${i + 1}...`}
                    onChange={(e) => {
                      const updated = [...workUnits];
                      updated[i].title = e.target.value;
                      setWorkUnits(updated);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem 0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem'
                    }}
                  />
                  <button type="button" className="btn-icon" onClick={() => handleRemoveUnit(i)} style={{ width: 28, height: 28 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddUnit}
              style={{ fontSize: '0.75rem', marginTop: '0.5rem', width: '100%', padding: '0.35rem' }}
            >
              <Plus size={13} />
              <span>Add Sub-Unit</span>
            </button>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button id="save-task-submit-btn" type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Schedule & Initialize Checkpoint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
