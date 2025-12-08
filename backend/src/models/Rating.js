import { RATING_SCALE } from '../config/constants.js';

export class Rating {
  constructor(data) {
    this.issueId = data.issueId;
    this.workerId = data.workerId;
    this.studentId = data.studentId;
    this.rating = data.rating;
    this.feedback = data.feedback || null;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static validate(data) {
    const errors = [];
    if (!data.issueId) errors.push('Issue ID is required');
    if (!data.workerId) errors.push('Worker ID is required');
    if (!data.studentId) errors.push('Student ID is required');
    if (!data.rating || typeof data.rating !== 'number' || data.rating < RATING_SCALE.MIN || data.rating > RATING_SCALE.MAX) {
      errors.push(`Rating must be a number between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}`);
    }
    if (data.feedback && data.feedback.length > 500) errors.push('Feedback must be less than 500 characters');
    return { isValid: errors.length === 0, errors };
  }

  toFirestore() {
    return {
      issueId: this.issueId,
      workerId: this.workerId,
      studentId: this.studentId,
      rating: this.rating,
      feedback: this.feedback,
      createdAt: this.createdAt,
    };
  }

  static fromFirestore(doc) {
    return new Rating(doc.data());
  }
}

