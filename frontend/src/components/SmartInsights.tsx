import { useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, X } from 'lucide-react';
import api from '../api/axios';

interface SmartInsightsProps {
  roomId: string;
  chatMessages: any[];
  onClose: () => void;
}

export const SmartInsights = ({ roomId, chatMessages, onClose }: SmartInsightsProps) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const performAnalysis = async () => {
    setLoading(true);
    try {
      const content = chatMessages.map(m => `${m.sender}: ${m.text}`).join('\n');
      const response = await api.post(`/meetings/${roomId}/analyze-mood`, { content });
      setAnalysis(response.data);
    } catch (error) {
      console.error('Mood analysis failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel" style={{ width: '300px' }}>
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="var(--primary-color)" />
          <span style={{ fontWeight: 600 }}>AI Smart Insights</span>
        </div>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="chat-messages" style={{ padding: '1.5rem' }}>
        {!analysis && !loading && (
          <div style={{ textAlign: 'center' }}>
            <TrendingUp size={48} color="var(--text-secondary)" style={{ margin: '1rem auto', opacity: 0.3 }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Analyze the meeting's mood and get AI-powered insights based on the chat.
            </p>
            <button className="btn-primary" onClick={performAnalysis} style={{ width: '100%' }}>
              Analyze Now
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gemini is thinking...</p>
          </div>
        )}

        {analysis && (
          <div className="analysis-results" style={{ animation: 'fadeIn 0.5s ease' }}>
            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid var(--primary-color)' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Current Mood</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', margin: '0.25rem 0' }}>{analysis.mood}</div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${analysis.sentimentScore}%`, 
                  background: 'var(--primary-color)',
                  transition: 'width 1s ease'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} color="var(--secondary-color)" />
                AI INSIGHTS
              </div>
              {analysis.insights.map((insight: string, idx: number) => (
                <div key={idx} className="glass-card" style={{ padding: '0.75rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)' }}>
                  {insight}
                </div>
              ))}
            </div>

            <button 
              className="btn-secondary" 
              onClick={() => setAnalysis(null)} 
              style={{ width: '100%', marginTop: '2rem', fontSize: '0.8rem' }}
            >
              Refresh Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
