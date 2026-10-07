import React, { useState } from 'react';
import { ContinuityOverview } from '../types';
import { api } from '../services/api';
import { X, Bookmark, Check } from 'lucide-react';

interface OverrideModalProps {
  item: ContinuityOverview | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({ item, onClose, onUpdated }) => {
  if (!item) return null;

  const [checkpointTitle, setCheckpointTitle] = useState(item.resumePoint.checkpoint_title);
  const [stoppingContext, setStoppingContext] = useState(item.resumePoint.stopping_context || '');
  const [nextAction, setNextAction] = useState(item.resumePoint.next_recommended_action || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.overrideResumePoint(item.task.id, checkpointTitle, stoppingContext, nextAction);
      onUpdated();
      onClose();
    } catch (err) {
      console.error('Failed to override resume point:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="override-modal-overlay" className="modal-overlay" onClick={onClose}>
      <div 
        id="override-modal-content"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark size={18} color="var(--accent-secondary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Adjust Resume Checkpoint</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Checkpoint Title / Work Unit
            </label>
            <input
              type="text"
              required
              value={checkpointTitle}
              onChange={(e) => setCheckpointTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.55rem 0.85rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Your Stopping Note & Context
            </label>
            <textarea
              rows={3}
              placeholder="Where you stopped, open thoughts, or blocking bugs..."
              value={stoppingContext}
              onChange={(e) => setStoppingContext(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.55rem 0.85rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Next Recommended Action
            </label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.55rem 0.85rem',
                color: 'var(--text-main)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Check size={16} />
              <span>{saving ? 'Updating...' : 'Save Checkpoint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
