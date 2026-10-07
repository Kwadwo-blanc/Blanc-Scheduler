import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalIcon, 
  Clock, 
  ListOrdered, 
  BarChart2, 
  Play,
  RotateCcw
} from 'lucide-react';

type CalMode = 'day' | 'week' | 'month' | 'agenda' | 'timeline';

interface CalendarViewProps {
  onSelectTaskById: (taskId: string) => void;
  onOpenNewTask: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectTaskById,
  onOpenNewTask
}) => {
  const { activeWorkspace } = useAuth();
  const [mode, setMode] = useState<CalMode>('week');
  const [currentDate, setCurrentDate] = useState<string>('2026-10-07');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekData, setWeekData] = useState<any>(null);
  const [agendaData, setAgendaData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCalendar = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const taskRes = await api.getTasks(activeWorkspace.id);
      setTasks(taskRes.tasks);

      if (mode === 'week') {
        const res = await api.getWeekView(activeWorkspace.id, currentDate);
        setWeekData(res.weekView);
      } else if (mode === 'agenda') {
        const res = await api.getAgendaView(activeWorkspace.id);
        setAgendaData(res.agenda);
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [activeWorkspace?.id, mode, currentDate]);

  const changeDate = (deltaDays: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + deltaDays);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  return (
    <div id="calendar-scheduler-container">
      {/* Calendar Header Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button 
              id="cal-prev-btn" 
              className="btn btn-secondary btn-icon" 
              onClick={() => changeDate(mode === 'week' ? -7 : -1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              id="cal-next-btn" 
              className="btn btn-secondary btn-icon" 
              onClick={() => changeDate(mode === 'week' ? 7 : 1)}
            >
              <ChevronRight size={16} />
            </button>
            <button 
              id="cal-today-btn" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setCurrentDate('2026-10-07')}
            >
              Today
            </button>
          </div>

          <h3 style={{ fontSize: '1.25rem' }}>
            {mode === 'week' && weekData ? `${weekData.startDate} — ${weekData.endDate}` : currentDate}
          </h3>
        </div>

        {/* View Mode Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
          {(['day', 'week', 'month', 'agenda', 'timeline'] as CalMode[]).map((v) => (
            <button
              key={v}
              id={`cal-mode-${v}`}
              onClick={() => setMode(v)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                background: mode === v ? 'var(--accent-primary)' : 'transparent',
                color: mode === v ? '#fff' : 'var(--text-muted)'
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Week View */}
      {mode === 'week' && weekData && (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.75rem',
            overflowX: 'auto',
            minHeight: 520
          }}
        >
          {weekData.days.map((day: any) => {
            const isToday = day.date === '2026-10-07';

            return (
              <div 
                key={day.date}
                className="glass-panel"
                style={{
                  padding: '1rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  background: isToday ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
                  borderColor: isToday ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: isToday ? 'var(--accent-primary)' : 'var(--text-dim)', fontWeight: 700 }}>
                    {day.dayName}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isToday ? '#fff' : 'var(--text-main)' }}>
                    {day.date.split('-')[2]}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {day.tasks.map((t: Task) => (
                    <div
                      key={t.id}
                      id={`cal-task-${t.id}`}
                      onClick={() => onSelectTaskById(t.id)}
                      style={{
                        padding: '0.7rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderLeft: `3px solid ${t.category === 'study' ? '#3b82f6' : '#10b981'}`,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                        <span>{t.scheduled_start.split('T')[1].slice(0, 5)}</span>
                        <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', marginBottom: '0.35rem' }}>
                        {t.title}
                      </div>
                      <div className="progress-bar-container" style={{ height: 4 }}>
                        <div className="progress-bar-fill" style={{ width: `${t.progress_pct}%` }} />
                      </div>
                    </div>
                  ))}

                  {day.tasks.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '2rem' }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {mode === 'day' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>
            Scheduled Sessions for {currentDate}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {tasks.map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTaskById(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className={`badge badge-${t.category}`}>{t.category}</span>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                  </div>
                  <h4 style={{ fontSize: '1rem' }}>{t.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.description}</p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    {t.progress_pct}% Complete
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {t.scheduled_start.split('T')[1].slice(0, 5)} - {t.scheduled_end.split('T')[1].slice(0, 5)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {mode === 'agenda' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Chronological Agenda</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {agendaData.map((group) => (
              <div key={group.date}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {group.date}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {group.tasks.map((t: Task) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTaskById(t.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{t.title}</span>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline View */}
      {mode === 'timeline' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Execution Timeline & Milestones</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 220, fontSize: '0.85rem', fontWeight: 600 }}>{t.title}</div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div className="progress-bar-container" style={{ height: 16, borderRadius: 4 }}>
                    <div className="progress-bar-fill" style={{ width: `${t.progress_pct}%` }} />
                  </div>
                </div>
                <div style={{ width: 60, textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                  {t.progress_pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month View Placeholder */}
      {mode === 'month' && (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h4>Month Horizon Overview</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Total scheduled hours this month: 48h across 24 checkpoints.
          </p>
        </div>
      )}
    </div>
  );
};
