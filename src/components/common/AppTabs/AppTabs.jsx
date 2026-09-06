import React from 'react';
import './AppTabs.scss';

export default function AppTabs({
  tabs = [],
  value,
  onChange,
  className = '',
}) {
  return (
    <div className={`app-tabs-wrap ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`app-tab-btn ${isActive ? 'app-tab-btn--active' : ''}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.icon && <span className="app-tab-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
