import React from 'react';
import { Tooltip } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useTheme, THEMES } from '../../../context/ThemeContext';
import './ThemeToggle.scss';

/**
 * ThemeToggle
 * Luxury 3-mode theme switcher supporting:
 *  - 'default' (Royal Gold / Obsidian Black)
 *  - 'dark' (Modern Slate / Deep Charcoal)
 *  - 'light' (Ivory Luxury Light)
 *
 * @param {'segmented' | 'icon' | 'tiles'} variant - Display style
 * @param {string} className - Optional additional CSS class
 * @param {boolean} showLabels - Show text labels in segmented mode
 */
export const ThemeToggle = ({
  variant = 'icon',
  className = '',
  showLabels = true,
  size = 'md',
}) => {
  const { theme, setTheme, cycleTheme } = useTheme();

  const themeOptions = [
    {
      id: THEMES.DEFAULT,
      label: 'Royal Gold',
      shortLabel: 'Royal',
      icon: <AutoAwesomeOutlinedIcon className="theme-opt-icon" />,
      desc: 'Obsidian Black & Signature Royal Gold',
    },
    {
      id: THEMES.DARK,
      label: 'Dark Mode',
      shortLabel: 'Dark',
      icon: <DarkModeOutlinedIcon className="theme-opt-icon" />,
      desc: 'Modern Slate & Soothing Charcoal',
    },
    {
      id: THEMES.LIGHT,
      label: 'Light Mode',
      shortLabel: 'Light',
      icon: <LightModeOutlinedIcon className="theme-opt-icon" />,
      desc: 'Soft Slate & Ivory Luxury',
    },
  ];

  const currentOption =
    themeOptions.find((opt) => opt.id === theme) || themeOptions[0];

  if (variant === 'icon') {
    return (
      <Tooltip
        title={`Theme: ${currentOption.label} (Click to switch)`}
        placement="bottom"
        arrow
      >
        <button
          type="button"
          onClick={cycleTheme}
          className={`theme-toggle-btn theme-toggle-btn--${size} ${className}`}
          aria-label={`Current theme: ${currentOption.label}. Click to switch theme.`}
        >
          <span className="theme-icon-wrap">{currentOption.icon}</span>
        </button>
      </Tooltip>
    );
  }

  if (variant === 'tiles') {
    return (
      <div className={`theme-tiles-grid ${className}`}>
        {themeOptions.map((opt) => {
          const active = theme === opt.id;
          return (
            <div
              key={opt.id}
              role="button"
              tabIndex={0}
              onClick={() => setTheme(opt.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setTheme(opt.id);
                }
              }}
              className={`theme-preview-tile theme-preview-tile--${opt.id} ${
                active ? 'is-active' : ''
              }`}
            >
              <div className="tile-badge-corner">
                {active && <span className="active-dot" />}
              </div>
              <div className="tile-icon-header">{opt.icon}</div>
              <div className="tile-info">
                <span className="tile-title">{opt.label}</span>
                <span className="tile-desc">{opt.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default segmented bar
  return (
    <div
      className={`theme-segmented-group theme-segmented-group--${size} ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      {themeOptions.map((opt) => {
        const active = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`theme-segment-btn ${active ? 'is-active' : ''}`}
            aria-pressed={active}
            title={opt.label}
          >
            <span className="segment-icon">{opt.icon}</span>
            {showLabels && (
              <span className="segment-label">{opt.shortLabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
