import { useEffect, useState } from 'react';

interface LiveCaptionsProps {
  text: string;
}

export const LiveCaptions = ({ text }: LiveCaptionsProps) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (text) {
      setDisplayText(text);
      
      // Auto-clear after 3 seconds of no updates
      const timer = setTimeout(() => {
        setDisplayText('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [text]);

  if (!displayText) return null;

  return (
    <div className="captions-overlay">
      {displayText}
    </div>
  );
};
