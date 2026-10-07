import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AIAssistantModalProps {
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ onClose }) => {
  const { user, activeWorkspace } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello ${user?.full_name || 'there'}! I am your Continuum AI Assistant. I have live access to your schedule, current resume points, and attached learning materials. What would you like to review or plan?`
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const quickPrompts = [
    'Where did I stop yesterday?',
    'What should I study or work on next?',
    'Explain the concepts in Chapter 4',
    'Break down my next goal into actionable work units'
  ];

  const handleSend = async (msgText: string) => {
    if (!msgText.trim() || loading) return;

    const userMsg = msgText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAI(userMsg, activeWorkspace?.id);
      setMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-modal-overlay" className="modal-overlay" onClick={onClose}>
      <div 
        id="ai-modal-content"
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 640,
          background: '#0a0f1d',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          height: '75vh',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(99, 102, 241, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Continuum AI Assistant</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
                <ShieldCheck size={13} />
                <span>Grounded Continuity Pipeline Active</span>
              </div>
            </div>
          </div>

          <button id="close-ai-modal" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, idx) => (
            <div 
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              {m.sender === 'ai' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} color="var(--accent-primary)" />
                </div>
              )}

              <div 
                style={{
                  background: m.sender === 'user' ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.8rem 1rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: '#fff'
                }}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              <Sparkles size={16} className="animate-spin" />
              <span>Synthesizing grounded continuity records...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', paddingTop: '0.5rem' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              className="btn btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap', borderRadius: 9999 }}
              onClick={() => handleSend(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}
        >
          <input
            id="ai-prompt-input"
            type="text"
            placeholder="Ask about your resume points, schedule, or concepts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 1rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem'
            }}
          />

          <button 
            id="ai-submit-prompt-btn"
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !input.trim()}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
};
