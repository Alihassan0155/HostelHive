import { ISSUE_TYPES, ISSUE_STATUS } from '../config/constants.js';

export class Issue {
  constructor(data) {
    this.studentId = data.studentId;
    this.createdBy = data.createdBy || data.studentId; // userId of the user who created the issue
    this.hostelId = data.hostelId;
    this.roomNumber = data.roomNumber;
    this.title = data.title;
    this.description = data.description;
    this.type = data.type;
    this.status = data.status || ISSUE_STATUS.PENDING;
    this.assignedWorkerId = data.assignedWorkerId || null;
    this.photos = data.photos || [];
    this.trackingNumber = data.trackingNumber;
    // Always use current time for createdAt (don't allow override)
    this.createdAt = new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.completedAt = data.completedAt || null;
    this.workerNotes = data.workerNotes || null;
    this.workerPhotos = data.workerPhotos || [];
    this.ratedAt = data.ratedAt || null; // When the rating was given (for quick lookup)
  }

  static validate(data) {
    const errors = [];
    if (!data.title || data.title.trim().length === 0) errors.push('Title is required');
    if (!data.description || data.description.trim().length === 0) errors.push('Description is required');
    if (!Object.values(ISSUE_TYPES).includes(data.type)) errors.push(`Type must be one of: ${Object.values(ISSUE_TYPES).join(', ')}`);
    if (!data.hostelId) errors.push('Hostel ID is required');
    if (!data.roomNumber) errors.push('Room number is required');
    if (data.photos && !Array.isArray(data.photos)) errors.push('Photos must be an array');
    return { isValid: errors.length === 0, errors };
  }

  toFirestore() {
    return {
      studentId: this.studentId,
      createdBy: this.createdBy,
      hostelId: this.hostelId,
      roomNumber: this.roomNumber,
      title: this.title,
      description: this.description,
      type: this.type,
      status: this.status,
      assignedWorkerId: this.assignedWorkerId,
      photos: this.photos,
      trackingNumber: this.trackingNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      workerNotes: this.workerNotes,
      workerPhotos: this.workerPhotos,
      ratedAt: this.ratedAt,
    };
  }

  static fromFirestore(doc) {
    return new Issue(doc.data());
  }
}

