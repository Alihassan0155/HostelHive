// src/components/UI/DateDisplay.jsx
import React from 'react';
import { Calendar, Clock, CalendarClock } from 'lucide-react';
import { formatDate, formatDateOnly, formatTimeOnly, formatRelativeTime, parseTimestamp } from '../../utils/dateUtils';

const DateDisplay = ({ 
  timestamp, 
  variant = 'datetime', // 'date', 'time', 'datetime', 'relative'
  showIcon = true,
  className = '',
  iconClassName = ''
}) => {
  const date = parseTimestamp(timestamp);
  
  if (!date) {
    return <span className={className}>N/A</span>;
  }

  let displayText;
  let IconComponent;

  switch (variant) {
    case 'date':
      displayText = formatDateOnly(timestamp);
      IconComponent = Calendar;
      break;
    case 'time':
      displayText = formatTimeOnly(timestamp);
      IconComponent = Clock;
      break;
    case 'relative':
      displayText = formatRelativeTime(timestamp);
      IconComponent = Clock;
      break;
    case 'datetime':
    default:
      displayText = formatDate(timestamp);
      IconComponent = CalendarClock;
      break;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && IconComponent && (
        <IconComponent className={`w-4 h-4 text-gray-500 ${iconClassName}`} />
      )}
      <span className="font-medium text-gray-900">{displayText}</span>
    </div>
  );
};

export default DateDisplay;

