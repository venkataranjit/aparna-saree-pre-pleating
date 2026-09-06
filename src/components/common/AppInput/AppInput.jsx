import React, { useState, useRef, useEffect, useMemo } from 'react';
import CheckIcon from '@mui/icons-material/Check';
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
  options = null,
  children,
  className = '',
  wrapperClassName = '',
  ...rest
}) {
  const isError = Boolean(error);
  const displayHelper = error || helperText;

  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Extract option objects from children (<option value="val">Label</option>) or options prop
  const selectOptions = useMemo(() => {
    if (options && Array.isArray(options)) return options;
    const items = [];
    React.Children.forEach(children, (child) => {
      if (!child) return;
      const val =
        child.props?.value !== undefined
          ? child.props.value
          : child.props?.children;
      items.push({
        value: val,
        label: child.props?.children || val,
        disabled: Boolean(child.props?.disabled),
      });
    });
    return items;
  }, [children, options]);

  const selectedOption = selectOptions.find(
    (opt) => String(opt.value) === String(value)
  );
  const displayLabel = selectedOption ? selectedOption.label : value;

  // Handle outside click & escape key to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
        if (onBlur) {
          onBlur({ target: { name, value } });
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        if (onBlur) {
          onBlur({ target: { name, value } });
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, name, value, onBlur]);

  const handleSelect = (opt) => {
    if (opt.disabled || disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: opt.value,
        },
      });
    }
    setIsOpen(false);
    if (onBlur) {
      onBlur({
        target: {
          name,
          value: opt.value,
        },
      });
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div
      className={`app-input-group ${isError ? 'app-input-group--error' : ''} ${
        disabled ? 'app-input-group--disabled' : ''
      } ${select && isOpen ? 'app-input-group--select-open' : ''} ${className}`.trim()}
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
        } ${select ? 'app-input-wrapper--select' : ''} ${
          select && isOpen ? 'app-input-wrapper--select-open' : ''
        } ${wrapperClassName}`.trim()}
      >
        {startAdornment && (
          <div className="app-input-adornment app-input-adornment--start">
            {startAdornment}
          </div>
        )}

        {select ? (
          <div
            ref={selectRef}
            className={`app-custom-select ${
              isOpen ? 'app-custom-select--open' : ''
            }`}
          >
            <button
              type="button"
              id={name}
              disabled={disabled}
              className="app-custom-select-trigger"
              onClick={() => !disabled && setIsOpen((prev) => !prev)}
              onKeyDown={handleTriggerKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              <span
                className={`app-custom-select-label ${
                  !displayLabel ? 'placeholder' : ''
                }`}
              >
                {displayLabel || placeholder || 'Select option...'}
              </span>
              <span className="app-custom-select-arrow" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>

            {/* Hidden input for form serialization */}
            <input type="hidden" name={name} value={value ?? ''} />

            {/* Custom Luxury Dropdown Menu */}
            {isOpen && (
              <div className="app-custom-select-dropdown" role="listbox">
                {selectOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      className={`app-custom-select-item ${
                        isSelected ? 'selected' : ''
                      } ${opt.disabled ? 'disabled' : ''}`}
                      onClick={() => handleSelect(opt)}
                    >
                      <span className="item-text">{opt.label}</span>
                      {isSelected && (
                        <span className="item-check" aria-hidden="true">
                          <CheckIcon className="item-check-icon" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
