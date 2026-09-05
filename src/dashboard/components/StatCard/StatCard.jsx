import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckIcon from '@mui/icons-material/Check';
import './StatCard.scss';

const StatCard = ({
  title,
  value,
  prevValue,
  prevLabel = null,
  icon,
  change,
  trendType = 'up',
}) => {
  const renderTrendIcon = () => {
    if (trendType === 'completed') {
      return <CheckIcon className="trend-icon" sx={{ color: '#d4af37 !important' }} />;
    }
    if (trendType === 'progress') {
      return <span className="trend-pulse-dot" />;
    }
    return <TrendingUpIcon className="trend-icon" sx={{ color: '#d4af37 !important' }} />;
  };

  return (
    <Box className="stat-card">
      <div className="stat-card__top-bar" />
      
      {/* Header: Title and Icon Badge */}
      <Box className="stat-card__header">
        <Typography className="stat-card__title">{title}</Typography>
        <Box className="stat-card__icon-wrap">
          {icon}
        </Box>
      </Box>

      {/* Central Metric Value Group: Prev Month on the left (small), Current Month on the right (big) */}
      <Box className="stat-card__value-group">
        {prevValue && (
          <Box className="stat-card__prev-box" title="Previous Month">
            <Typography className="stat-card__prev-value">
              {prevValue}
            </Typography>
            {prevLabel && (
              <Typography className="stat-card__prev-label">
                {prevLabel}
              </Typography>
            )}
          </Box>
        )}

        <Typography className="stat-card__value">
          {value}
        </Typography>
      </Box>

      {/* Footer: Trend / Status Pill */}
      {change && (
        <Box className="stat-card__footer">
          <Box className={`stat-card__badge ${trendType}`}>
            {renderTrendIcon()}
            <Typography component="span" className="badge-text">
              {change}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};


export default StatCard;

