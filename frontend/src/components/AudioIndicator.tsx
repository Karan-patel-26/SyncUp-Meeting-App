import { useEffect, useState, useRef } from 'react';

interface AudioIndicatorProps {
  stream: MediaStream | null;
}

export const AudioIndicator = ({ stream }: AudioIndicatorProps) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setVolume(0);
      return;
    }

    const initAudio = () => {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(average);
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    };

    initAudio();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  // Scale volume (0-100 approx) to bar heights
  const bars = [1, 2, 3, 4, 5];
  
  return (
    <div className="audio-indicator" title="Audio level">
      {bars.map((bar) => {
        const height = Math.min(Math.max((volume / 50) * 100 * (bar / 5), 2), 16);
        return (
          <div 
            key={bar} 
            className="audio-bar" 
            style={{ 
              height: `${height}px`,
              opacity: volume > 5 ? 1 : 0.3
            }} 
          />
        );
      })}
    </div>
  );
};
