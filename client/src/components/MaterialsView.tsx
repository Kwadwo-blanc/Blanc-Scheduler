import React, { useState, useEffect } from 'react';
import { LearningMaterial } from '../types';
import { api } from '../services/api';
import { BookOpen, FileText, ExternalLink, Bookmark, Plus } from 'lucide-react';

export const MaterialsView: React.FC = () => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);

  useEffect(() => {
    api.getMaterials().then(res => setMaterials(res.materials));
  }, []);

  return (
    <div id="materials-view-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Digital Learning Materials & Resources
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Textbooks, PDF chapters, API specs, and research references bound directly to schedule continuity.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {materials.map((mat) => (
          <div key={mat.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-study" style={{ textTransform: 'uppercase' }}>
                  {mat.resource_type}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {new Date(mat.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} color="#60a5fa" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{mat.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Attached to active curriculum session. AI Assistant can reference this document for conceptual queries.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>
                ✓ Grounded Context Active
              </span>

              {mat.url && (
                <a 
                  href={mat.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <span>Open Resource</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
