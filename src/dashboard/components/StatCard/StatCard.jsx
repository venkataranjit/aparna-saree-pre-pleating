import React from 'react';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import './StatCard.scss';

const StatCard = ({
  title,
  value,
  subValue,
  prevValue,
  prevLabel = null,
  icon,
  change,
  trendType = 'up',
  customFooter = null,
  children,
}) => {
  const renderTrendIcon = () => {
    if (trendType === 'completed') {
      return <CheckIcon className="trend-icon" />;
    }
    if (trendType === 'progress' || trendType === 'pending') {
      return <AccessTimeIcon className="trend-icon" />;
    }
    if (trendType === 'dot') {
      return <span className="trend-pulse-dot" />;
    }
    return <TrendingUpIcon className="trend-icon" />;
  };

  return (
    <div className="stat-card">
      <div className="stat-card__top-bar" />
      
      {/* Header: Title and Icon Badge */}
      <div className="stat-card__header">
        <span className="stat-card__title">{title}</span>
        <div className="stat-card__icon-wrap">
          {icon}
        </div>
      </div>

      {/* Central Metric Value Group */}
      <div className="stat-card__value-group">
        {prevValue && (
          <div className="stat-card__prev-box" title="Previous Month">
            <span className="stat-card__prev-value">
              {prevValue}
            </span>
            {prevLabel && (
              <span className="stat-card__prev-label">
                {prevLabel}
              </span>
            )}
          </div>
        )}

        <span className="stat-card__value">
          {value}
        </span>

        {subValue && (
          <span className="stat-card__sub-value">
            {subValue}
          </span>
        )}
      </div>

      {/* Footer: Trend / Status Pill or Custom Footer */}
      {customFooter ? (
        <div className="stat-card__footer stat-card__footer--custom">
          {customFooter}
        </div>
      ) : change ? (
        <div className="stat-card__footer">
          <div className={`stat-card__badge ${trendType}`}>
            {renderTrendIcon()}
            <span className="badge-text">
              {change}
            </span>
          </div>
        </div>
      ) : null}

      {children}
    </div>
  );
};

export { StatCard };
export default StatCard;
