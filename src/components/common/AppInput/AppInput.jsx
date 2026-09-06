import React from 'react';
import './AppInput.scss';

export default function AppInput({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  startAdornment = null,
  endAdornment = null,
  multiline = false,
  rows = 3,
  select = false,
  children,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const isError = Boolean(error);
  const displayHelper = error || helperText;

  return (
    <div
      className={`app-input-group ${isError ? 'app-input-group--error' : ''} ${
        disabled ? 'app-input-group--disabled' : ''
      } ${className}`.trim()}
    >
      {label && (
        <label htmlFor={name} className="app-input-label">
          {label}
          {required && <span className="app-input-required">*</span>}
        </label>
      )}

      <div
        className={`app-input-wrapper ${
          multiline ? 'app-input-wrapper--multiline' : ''
        } ${wrapperClassName}`.trim()}
      >
        {startAdornment && (
          <div className="app-input-adornment app-input-adornment--start">
            {startAdornment}
          </div>
        )}

        {select ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className="app-input-control"
            {...rest}
          >
            {children}
          </select>
        ) : multiline ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className="app-input-control"
            {...rest}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="app-input-control"
            {...rest}
          />
        )}

        {endAdornment && (
          <div className="app-input-adornment app-input-adornment--end">
            {endAdornment}
          </div>
        )}
      </div>

      {displayHelper && (
        <span
          className={`app-input-helper ${
            isError ? 'app-input-helper--error' : ''
          }`}
        >
          {displayHelper}
        </span>
      )}
    </div>
  );
}
