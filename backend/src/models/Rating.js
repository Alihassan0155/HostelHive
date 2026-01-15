import { RATING_SCALE } from '../config/constants.js';

export class Rating {
  constructor(data) {
    this.issueId = data.issueId;
    this.studentId = data.studentId;
    this.workerId = data.workerId;
    this.rating = data.rating; // 1-5
    this.feedback = data.feedback || ''; // Optional feedback text
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  static validate(data) {
    const errors = [];
    
    if (!data.issueId) errors.push('Issue ID is required');
    if (!data.studentId) errors.push('Student ID is required');
    if (!data.workerId) errors.push('Worker ID is required');
    if (!data.rating) {
      errors.push('Rating is required');
    } else if (data.rating < RATING_SCALE.MIN || data.rating > RATING_SCALE.MAX) {
      errors.push(`Rating must be between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}`);
    }
    
    return { isValid: errors.length === 0, errors };
  }

  toFirestore() {
    return {
      issueId: this.issueId,
      studentId: this.studentId,
      workerId: this.workerId,
      rating: this.rating,
      feedback: this.feedback,
      createdAt: this.createdAt,
    };
  }

  static fromFirestore(doc) {
    return new Rating(doc.data());
  }
}
