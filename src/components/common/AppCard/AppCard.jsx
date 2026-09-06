import React from 'react';
import './AppCard.scss';

export default function AppCard({
  children,
  title,
  action,
  interactive = false,
  className = '',
  bodyClassName = '',
  onClick,
  ...rest
}) {
  return (
    <div
      className={`app-card ${interactive ? 'app-card--interactive' : ''} ${className}`.trim()}
      onClick={onClick}
      {...rest}
    >
      {(title || action) && (
        <div className="app-card__header">
          {title && <h4 className="app-card__title">{title}</h4>}
          {action && <div className="app-card__action">{action}</div>}
        </div>
      )}
      <div className={`app-card__body ${bodyClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
