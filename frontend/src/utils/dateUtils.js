// src/utils/dateUtils.js

/**
 * Convert various timestamp formats to Date object
 */
export const parseTimestamp = (timestamp) => {
  if (!timestamp) return null;
  
  let date;
  if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }
  
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Format date to locale string
 */
export const formatDate = (timestamp, options = {}) => {
  const date = parseTimestamp(timestamp);
  if (!date) return "N/A";
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return date.toLocaleString('en-US', defaultOptions);
};

/**
 * Format date only (no time)
 */
export const formatDateOnly = (timestamp) => {
  const date = parseTimestamp(timestamp);
  if (!date) return "N/A";
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format time only (no date)
 */
export const formatTimeOnly = (timestamp) => {
  const date = parseTimestamp(timestamp);
  if (!date) return "N/A";
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp) => {
  const date = parseTimestamp(timestamp);
  if (!date) return "N/A";
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffMs / 604800000);
  const diffMonths = Math.floor(diffMs / 2592000000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Convert Date to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export const dateToInputFormat = (date) => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : parseTimestamp(date);
  if (!d) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert datetime-local input format to Date
 */
export const inputFormatToDate = (inputValue) => {
  if (!inputValue) return null;
  const date = new Date(inputValue);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Get days in a month
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get first day of month (0 = Sunday, 6 = Saturday)
 */
export const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = date1 instanceof Date ? date1 : parseTimestamp(date1);
  const d2 = date2 instanceof Date ? date2 : parseTimestamp(date2);
  if (!d1 || !d2) return false;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  return isSameDay(date, new Date());
};

/**
 * Check if date is in the past
 */
export const isPast = (date) => {
  const d = date instanceof Date ? date : parseTimestamp(date);
  if (!d) return false;
  return d < new Date();
};

/**
 * Get month name
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

/**
 * Get short month name
 */
export const getShortMonthName = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
};

/**
 * Get day name
 */
export const getDayName = (dayIndex) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

/**
 * Get short day name
 */
export const getShortDayName = (dayIndex) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

