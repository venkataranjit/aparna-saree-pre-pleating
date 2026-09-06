import React from 'react';
import AppSpinner from '../AppSpinner/AppSpinner';
import './AppButton.scss';

export default function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  startIcon = null,
  endIcon = null,
  square = false,
  iconOnly = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const isSquare = square || iconOnly || variant === 'icon';
  const classes = [
    'app-btn',
    `app-btn--${variant}`,
    `app-btn--${size}`,
    isSquare ? 'app-btn--square' : '',
    fullWidth ? 'app-btn--full-width' : '',
    disabled || loading ? 'app-btn--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <AppSpinner
          size={size === 'lg' ? 'md' : 'sm'}
          color={variant === 'primary' ? 'black' : 'gold'}
        />
      ) : (
        startIcon && <span className="app-btn-icon app-btn-icon--start">{startIcon}</span>
      )}
      <span>{children}</span>
      {!loading && endIcon && (
        <span className="app-btn-icon app-btn-icon--end">{endIcon}</span>
      )}
    </button>
  );
}
