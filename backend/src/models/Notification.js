import { NOTIFICATION_TYPES } from '../config/constants.js';

export class Notification {
  constructor(data) {
    this.userId = data.userId;
    this.type = data.type;
    this.message = data.message;
    this.relatedIssueId = data.relatedIssueId || null;
    this.relatedWorkerId = data.relatedWorkerId || null;
    this.read = data.read || false;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static validate(data) {
    const errors = [];
    if (!data.userId) errors.push('User ID is required');
    if (!data.message || data.message.trim().length === 0) errors.push('Message is required');
    if (data.type && !Object.values(NOTIFICATION_TYPES).includes(data.type)) {
      errors.push(`Type must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`);
    }
    return { isValid: errors.length === 0, errors };
  }

  toFirestore() {
    return {
      userId: this.userId,
      type: this.type,
      message: this.message,
      relatedIssueId: this.relatedIssueId,
      relatedWorkerId: this.relatedWorkerId,
      read: this.read,
      createdAt: this.createdAt,
    };
  }

  static fromFirestore(doc) {
    return new Notification(doc.data());
  }
}

