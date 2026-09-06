import React from 'react';
import './AppSpinner.scss';

export default function AppSpinner({
  size = 'md',
  color = 'gold',
  className = '',
}) {
  const sizeClass = `app-spinner--${size}`;
  const colorClass = `app-spinner--${color}`;

  return (
    <span
      className={`app-spinner ${sizeClass} ${colorClass} ${className}`.trim()}
      role="status"
      aria-label="Loading"
    >
      <svg viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="4.5"
        />
      </svg>
    </span>
  );
}
