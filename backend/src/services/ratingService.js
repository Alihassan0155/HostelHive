import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import { Rating } from '../models/Rating.js';

export class RatingService {
  static async getRatingById(ratingId) {
    const ratingDoc = await db.collection(COLLECTIONS.RATINGS).doc(ratingId).get();
    if (!ratingDoc.exists) {
      throw new Error('Rating not found');
    }
    return { id: ratingDoc.id, ...ratingDoc.data() };
  }

  static async getRatings(filters = {}) {
    let query = db.collection(COLLECTIONS.RATINGS);
    if (filters.workerId) query = query.where('workerId', '==', filters.workerId);
    if (filters.issueId) query = query.where('issueId', '==', filters.issueId);
    if (filters.studentId) query = query.where('studentId', '==', filters.studentId);
    query = query.orderBy('createdAt', 'desc');
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async createRating(ratingData) {
    const existingRatings = await this.getRatings({ issueId: ratingData.issueId });
    if (existingRatings.length > 0) {
      throw new Error('Rating already exists for this issue');
    }
    const { IssueService } = await import('./issueService.js');
    const issue = await IssueService.getIssueById(ratingData.issueId);
    if (issue.status !== 'closed') {
      throw new Error('Can only rate closed issues');
    }
    if (issue.studentId !== ratingData.studentId) {
      throw new Error('Only the student who reported the issue can rate');
    }
    const validation = Rating.validate(ratingData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    const rating = new Rating(ratingData);
    const docRef = await db.collection(COLLECTIONS.RATINGS).add(rating.toFirestore());
    return { id: docRef.id, ...rating.toFirestore() };
  }

  static async getWorkerAverageRating(workerId) {
    const ratings = await this.getRatings({ workerId });
    if (ratings.length === 0) {
      return { average: 0, count: 0, ratings: [] };
    }
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const average = sum / ratings.length;
    return {
      average: Math.round(average * 10) / 10,
      count: ratings.length,
      ratings: ratings.map((r) => ({ rating: r.rating, feedback: r.feedback, createdAt: r.createdAt })),
    };
  }

  static async updateRating(ratingId, updateData) {
    const ratingDoc = await db.collection(COLLECTIONS.RATINGS).doc(ratingId);
    const existingRating = await ratingDoc.get();
    if (!existingRating.exists) {
      throw new Error('Rating not found');
    }
    const updatedData = { ...existingRating.data(), ...updateData };
    await ratingDoc.update(updatedData);
    return { id: ratingId, ...updatedData };
  }

  static async deleteRating(ratingId) {
    const ratingDoc = await db.collection(COLLECTIONS.RATINGS).doc(ratingId);
    const exists = await ratingDoc.get();
    if (!exists.exists) {
      throw new Error('Rating not found');
    }
    await ratingDoc.delete();
    return { success: true };
  }
}

