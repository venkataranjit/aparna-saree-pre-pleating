import React, { useState, useRef, useMemo } from 'react';
import Popover from '@mui/material/Popover';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import TodayIcon from '@mui/icons-material/Today';
import './AppDatePicker.scss';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Helper to format YYYY-MM-DD to human readable 'DD MMM YYYY'
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const dd = String(day).padStart(2, '0');
        const mmm = MONTH_NAMES[month]?.slice(0, 3) || '';
        return `${dd} ${mmm} ${year}`;
      }
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

// Helper to format Date object to 'YYYY-MM-DD'
const toIsoDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function AppDatePicker({
  label,
  name,
  value, // 'YYYY-MM-DD'
  onChange,
  placeholder = 'Select date...',
  error = false,
  helperText = '',
  disabled = false,
  required = false,
  minDate = null, // 'YYYY-MM-DD'
  maxDate = null, // 'YYYY-MM-DD'
  showPresets = true,
  className = '',
}) {
  const [anchorEl, setAnchorEl] = useState(null);
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

  // Current calendar view month and year
  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d.getTime())) return d;
      }
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const isOpen = Boolean(anchorEl);

  const handleOpen = (e) => {
    if (disabled) return;
    if (isOpen) {
      handleClose();
      return;
    }
    // reset view to selected date or today
    setViewYear(initialDate.getFullYear());
    setViewMonth(initialDate.getMonth());
    setAnchorEl(triggerRef.current || e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (year, month, day) => {
    const d = new Date(year, month, day);
    const isoStr = toIsoDateString(d);

    if (onChange) {
      onChange({
        target: {
          name,
          value: isoStr,
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

  const handlePresetSelect = (daysOffset) => {
    const target = new Date();
    target.setDate(target.getDate() + daysOffset);
    const isoStr = toIsoDateString(target);
    if (onChange) {
      onChange({
        target: {
          name,
          value: isoStr,
        },
      });
    }
    handleClose();
  };

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const todayStr = toIsoDateString(new Date());
    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = toIsoDateString(new Date(prevYear, prevMonth, dayNum));
      days.push({
        dayNum,
        year: prevYear,
        month: prevMonth,
        isCurrentMonth: false,
        iso,
        isToday: iso === todayStr,
        isSelected: iso === value,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const iso = toIsoDateString(new Date(viewYear, viewMonth, i));
      days.push({
        dayNum: i,
        year: viewYear,
        month: viewMonth,
        isCurrentMonth: true,
        iso,
        isToday: iso === todayStr,
        isSelected: iso === value,
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = toIsoDateString(new Date(nextYear, nextMonth, i));
      days.push({
        dayNum: i,
        year: nextYear,
        month: nextMonth,
        isCurrentMonth: false,
        iso,
        isToday: iso === todayStr,
        isSelected: iso === value,
      });
    }

    return days;
  }, [viewYear, viewMonth, value]);

  const displayValue = formatDisplayDate(value);

  return (
    <div
      className={`app-datepicker-group ${error ? 'app-datepicker-group--error' : ''} ${
        disabled ? 'app-datepicker-group--disabled' : ''
      } ${className}`.trim()}
    >
      {label && (
        <label className="app-datepicker-label">
          {typeof label === 'string' && required ? label.replace(/\s*\*\s*$/, '') : label}
          {required && <span className="app-datepicker-required">*</span>}
        </label>
      )}

      <div
        ref={triggerRef}
        className={`app-datepicker-trigger ${isOpen ? 'is-open' : ''} ${
          error ? 'is-error' : ''
        } ${disabled ? 'is-disabled' : ''}`}
        onClick={handleOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            handleOpen(e);
          }
        }}
      >
        <div className="datepicker-adornment">
          <CalendarTodayOutlinedIcon style={{ fontSize: 18 }} />
        </div>

        <div className="datepicker-value-wrap">
          {displayValue ? (
            <span className="datepicker-value-text">{displayValue}</span>
          ) : (
            <span className="datepicker-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="datepicker-actions">
          {value && !disabled && (
            <button
              type="button"
              className="datepicker-clear-btn"
              onClick={handleClear}
              title="Clear date"
            >
              <ClearIcon style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>

      {displayHelper && (
        <span
          className={`app-datepicker-helper ${
            isError ? 'app-datepicker-helper--error' : ''
          }`}
        >
          {displayHelper}
        </span>
      )}

      {/* Calendar Popover */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        style={{ zIndex: 9999 }}
        sx={{ zIndex: 9999 }}
        slotProps={{
          root: {
            className: 'app-datepicker-popover-root',
            style: { zIndex: 9999 },
          },
          paper: {
            className: 'app-datepicker-popover-paper',
            style: { zIndex: 9999 },
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
        <div className="app-datepicker-calendar">
          {/* Quick Presets for Target Delivery */}
          {showPresets && (
            <div className="calendar-presets-row">
              <button
                type="button"
                className="preset-chip"
                onClick={() => handlePresetSelect(0)}
              >
                Today
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => handlePresetSelect(1)}
              >
                Tomorrow
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => handlePresetSelect(2)}
              >
                2 Days
              </button>
              <button
                type="button"
                className="preset-chip"
                onClick={() => handlePresetSelect(3)}
              >
                3 Days
              </button>
            </div>
          )}

          {/* Month & Year Navigation Header */}
          <div className="calendar-nav-header">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeftIcon style={{ fontSize: 20 }} />
            </button>

            <span className="calendar-current-month">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRightIcon style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="calendar-weekdays-row">
            {WEEK_DAYS.map((wd) => (
              <span key={wd} className="weekday-header-cell">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid">
            {calendarDays.map((d, index) => {
              const isPastMin = minDate && d.iso < minDate;
              const isFutureMax = maxDate && d.iso > maxDate;
              const isDisabled = isPastMin || isFutureMax;

              return (
                <button
                  key={`${d.iso}_${index}`}
                  type="button"
                  disabled={isDisabled}
                  className={`calendar-day-cell ${
                    !d.isCurrentMonth ? 'is-other-month' : ''
                  } ${d.isToday ? 'is-today' : ''} ${
                    d.isSelected ? 'is-selected' : ''
                  } ${isDisabled ? 'is-disabled' : ''}`}
                  onClick={() => handleSelectDate(d.year, d.month, d.dayNum)}
                >
                  {d.dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-footer-btn"
              onClick={() => handlePresetSelect(0)}
            >
              <TodayIcon style={{ fontSize: 14, marginRight: 4 }} />
              Today
            </button>

            {value && (
              <button
                type="button"
                className="calendar-footer-btn calendar-footer-btn--clear"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Popover>
    </div>
  );
}
