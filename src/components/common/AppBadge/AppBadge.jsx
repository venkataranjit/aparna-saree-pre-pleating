import React from 'react';
import './AppBadge.scss';

export default function AppBadge({
  children,
  variant = 'neutral',
  icon = null,
  className = '',
  ...rest
}) {
  const normalizedVariant = String(variant).toLowerCase().replace(/\s+/g, '_');
  const classes = `app-badge app-badge--${normalizedVariant} ${className}`.trim();

  return (
    <span className={classes} {...rest}>
      {icon && <span className="app-badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
