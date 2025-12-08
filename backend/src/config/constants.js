// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  WORKER: 'worker',
};

// Issue Types
export const ISSUE_TYPES = {
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  CLEANING: 'cleaning',
  FURNITURE: 'furniture',
  INTERNET: 'internet',
  OTHER: 'other',
};

// Issue Urgency Levels - Removed, no longer needed
// Admin decides when to assign issues

// Issue Status
export const ISSUE_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CLOSED: 'closed',
};

// Worker Skills
export const WORKER_SKILLS = {
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  CLEANING: 'cleaning',
  CARPENTRY: 'carpentry',
  PAINTING: 'painting',
  GENERAL: 'general',
};

// Days of Week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  HOSTELS: 'hostels',
  ISSUES: 'issues',
  RATINGS: 'ratings',
  NOTIFICATIONS: 'notifications',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ISSUE_ASSIGNED: 'issue_assigned',
  WORKER_ON_WAY: 'worker_on_way',
  WORK_STARTED: 'work_started',
  WORK_COMPLETED: 'work_completed',
  ISSUE_CONFIRMED: 'issue_confirmed',
  ISSUE_REOPENED: 'issue_reopened',
  NEW_ISSUE: 'new_issue',
};

// Rating Scale
export const RATING_SCALE = {
  MIN: 1,
  MAX: 5,
};

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Tracking Number Prefix
export const TRACKING_PREFIX = 'HH';

