import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size = 24, className = '' }: SpinnerProps) => {
  return (
    <Loader2 
      size={size} 
      className={`animate-spin ${className}`} 
      style={{ animation: 'spin 1s linear infinite' }}
    />
  );
};

// Add the keyframes directly in case it's not in index.css
// Or we can rely on standard CSS. Let's add standard css animation class manually just in case.
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin { animation: spin 1s linear infinite; }
`;
document.head.appendChild(style);
