import { X, Ban, Cloud, Building, Camera } from 'lucide-react';
import type { EffectType } from '../services/videoEffect.service';

interface VideoEffectsMenuProps {
  activeEffect: EffectType;
  onSelectEffect: (effect: EffectType) => void;
  onClose: () => void;
}

export const VideoEffectsMenu = ({ activeEffect, onSelectEffect, onClose }: VideoEffectsMenuProps) => {
  const effects: { id: EffectType; label: string; icon: any }[] = [
    { id: 'none', label: 'No Effect', icon: Ban },
    { id: 'blur', label: 'Blur', icon: Cloud },
    { id: 'office', label: 'Office', icon: Building },
    { id: 'studio', label: 'Studio', icon: Camera },
    { id: 'minimal', label: 'Minimal', icon: Ban },
  ];

  return (
    <div className="effects-menu">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Video Effects</h3>
        <button className="tool-btn danger" onClick={onClose}><X size={18} /></button>
      </div>

      <div className="effects-grid">
        {effects.map((effect) => (
          <div 
            key={effect.id} 
            className={`effect-item ${activeEffect === effect.id ? 'active' : ''}`}
            onClick={() => onSelectEffect(effect.id)}
          >
            <div className="effect-thumb">
              <effect.icon size={24} opacity={0.5} />
            </div>
            <span className="effect-label">{effect.label}</span>
          </div>
        ))}
      </div>
      
      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
        Powered by AI Background Segmentation
      </p>
    </div>
  );
};
