import React, { useState, useRef, useMemo } from 'react';
import Popover from '@mui/material/Popover';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import './AppSelect.scss';

/**
 * AppSelect - Luxury Gold Styled Select Dropdown
 * Uses MUI Popover via React Portal to guarantee the menu is never clipped
 * by modals, tables, or overflow containers.
 */
export default function AppSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  startAdornment = null,
  error = false,
  helperText = '',
  disabled = false,
  required = false,
  searchable = false,
  allowClear = false,
  size = 'md', // 'sm' | 'md'
  className = '',
  wrapperClassName = '',
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef(null);

  const isError = Boolean(error);
  const displayHelper =
    typeof error === 'string' && error
      ? error
      : typeof helperText === 'string' && helperText
      ? helperText
      : helperText && typeof helperText !== 'boolean'
      ? helperText
      : null;

  const isOpen = Boolean(anchorEl);

  const handleOpen = (e) => {
    if (disabled) return;
    if (isOpen) {
      handleClose();
      return;
    }
    setAnchorEl(triggerRef.current || e.currentTarget);
    setSearchQuery('');
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  // Find selected option object
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  const displayLabel = selectedOption ? selectedOption.label : '';

  // Filter options if searchable
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        (opt.label && String(opt.label).toLowerCase().includes(q)) ||
        (opt.subtitle && String(opt.subtitle).toLowerCase().includes(q)) ||
        (opt.value && String(opt.value).toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

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
    handleClose();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: '',
        },
      });
    }
  };

  return (
    <div
      className={`app-select-group ${error ? 'app-select-group--error' : ''} ${
        disabled ? 'app-select-group--disabled' : ''
      } ${size === 'sm' ? 'app-select-group--sm' : ''} ${className}`.trim()}
    >
      {label && (
        <label className="app-select-label">
          {typeof label === 'string' && required ? label.replace(/\s*\*\s*$/, '') : label}
          {required && <span className="app-select-required">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        className={`app-select-trigger ${
          isOpen ? 'app-select-trigger--open' : ''
        } ${error ? 'app-select-trigger--error' : ''} ${
          disabled ? 'app-select-trigger--disabled' : ''
        } ${size === 'sm' ? 'app-select-trigger--sm' : ''} ${wrapperClassName}`.trim()}
        onClick={handleOpen}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            handleOpen(e);
          }
        }}
      >
        {startAdornment && (
          <div className="app-select-adornment app-select-adornment--start">
            {startAdornment}
          </div>
        )}

        <div className="app-select-value-wrap">
          {selectedOption ? (
            <span className="app-select-value-text">
              {selectedOption.icon && (
                <span className="option-icon">{selectedOption.icon}</span>
              )}
              {displayLabel}
            </span>
          ) : (
            <span className="app-select-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="app-select-actions">
          {allowClear && value && !disabled && (
            <button
              type="button"
              className="app-select-clear-btn"
              onClick={handleClear}
              title="Clear selection"
            >
              <ClearIcon style={{ fontSize: 14 }} />
            </button>
          )}

          <span className={`app-select-arrow ${isOpen ? 'is-rotated' : ''}`}>
            <KeyboardArrowDownIcon style={{ fontSize: 18 }} />
          </span>
        </div>
      </div>

      {displayHelper && (
        <span
          className={`app-select-helper ${
            isError ? 'app-select-helper--error' : ''
          }`}
        >
          {displayHelper}
        </span>
      )}

      {/* Luxury Portal Popover Menu */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        style={{ zIndex: 9999 }}
        sx={{ zIndex: 9999 }}
        slotProps={{
          root: {
            className: 'app-select-popover-root',
            style: { zIndex: 9999 },
          },
          paper: {
            className: 'app-select-popover-paper',
            style: {
              zIndex: 9999,
              width: anchorEl ? Math.max(anchorEl.getBoundingClientRect().width, 240) : 240,
            },
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div className="app-select-dropdown-container" role="listbox">
          {/* Optional Search Bar */}
          {(searchable || options.length > 7) && (
            <div className="app-select-search-box">
              <SearchIcon className="search-icon" />
              <input
                type="text"
                placeholder="Type to filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <ClearIcon style={{ fontSize: 13 }} />
                </button>
              )}
            </div>
          )}

          <div className="app-select-options-list">
            {filteredOptions.length === 0 ? (
              <div className="app-select-empty-msg">No options found</div>
            ) : (
              filteredOptions.map((opt, optIndex) => {
                const isSelected = String(opt.value) === String(value);

                return (
                  <div
                    key={`${String(opt.value)}_${optIndex}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`app-select-option ${
                      isSelected ? 'is-selected' : ''
                    } ${opt.disabled ? 'is-disabled' : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    <div className="option-content">
                      {opt.icon && <span className="option-icon">{opt.icon}</span>}
                      <div className="option-text-stack">
                        <span className="option-title">{opt.label}</span>
                        {opt.subtitle && (
                          <span className="option-subtitle">{opt.subtitle}</span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <span className="option-check-icon">
                        <CheckIcon style={{ fontSize: 16 }} />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Popover>
    </div>
  );
}
