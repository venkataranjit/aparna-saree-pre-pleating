import React from 'react';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import './AppViewToggle.scss';

/**
 * AppViewToggle - Luxury Gold View Mode Switcher
 * Supported modes:
 * - 'table': Tabular view with column sorting & expandable drawers
 * - 'grid': Multi-column responsive cards grid
 */
export default function AppViewToggle({
  value = 'table',
  onChange,
  modes = [
    { key: 'table', label: 'Table View', icon: <TableRowsOutlinedIcon style={{ fontSize: 18 }} /> },
    { key: 'grid', label: 'Grid View', icon: <GridViewOutlinedIcon style={{ fontSize: 18 }} /> },
  ],
  className = '',
}) {
  return (
    <div className={`app-view-toggle ${className}`.trim()} role="group" aria-label="View Mode Switcher">
      {modes.map((mode) => {
        const isActive = value === mode.key;
        return (
          <button
            key={mode.key}
            type="button"
            className={`app-view-toggle__btn ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange && onChange(mode.key)}
            title={mode.label}
            aria-pressed={isActive}
            aria-label={mode.label}
          >
            <span className="btn-icon">{mode.icon}</span>
            <span className="btn-label">{mode.label.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}
