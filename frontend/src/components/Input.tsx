import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <div className="input-wrapper">
          {icon && <span className="input-icon">{icon}</span>}
          <input
            ref={ref}
            className={`form-input ${error ? 'error' : ''} ${className}`}
            style={{ paddingLeft: icon ? '3rem' : '1rem' }}
            {...props}
          />
        </div>
        {error && <span className="error-text">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
