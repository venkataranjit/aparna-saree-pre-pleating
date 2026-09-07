import React from 'react';
import { formatDateTimeSafe, getModifiedDateTime } from '../../../firebase/dbService';
import './DateTimeCell.scss';

/**
 * DateTimeCell renders structured date and time for table cells.
 *
 * If `modifiedFrom` is provided:
 * - Checks whether `value` (updatedAt) is actually modified compared to `modifiedFrom` (createdAt).
 * - If identical or within initial creation threshold, renders a dash ("—").
 * - If modified, renders Date on top line and Time on bottom line.
 *
 * If `modifiedFrom` is omitted:
 * - Renders Date on top line, Time on bottom line (stacked like username and email).
 * - If no time was recorded (e.g. pure date string "05-Sep-2026"), renders date only.
 */
export const DateTimeCell = ({ value, modifiedFrom = null, fallback = '—' }) => {
  if (modifiedFrom !== null) {
    const mod = getModifiedDateTime(value, modifiedFrom);
    if (!mod) {
      return (
        <div className="table-date-time-cell">
          <span className="table-dash-text">{fallback}</span>
        </div>
      );
    }
    return (
      <div className="table-date-time-cell">
        <span className="table-date-text">{mod.date}</span>
        {mod.time && <span className="table-time-text">{mod.time}</span>}
      </div>
    );
  }

  const { date, time } = formatDateTimeSafe(value, fallback);
  if (!date || date === '-' || date === '—') {
    return (
      <div className="table-date-time-cell">
        <span className="table-dash-text">{fallback}</span>
      </div>
    );
  }

  return (
    <div className="table-date-time-cell">
      <span className="table-date-text">{date}</span>
      {time && <span className="table-time-text">{time}</span>}
    </div>
  );
};

export default DateTimeCell;
