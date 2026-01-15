import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import { RATING_SCALE } from '../config/constants.js';
import { UserService } from './userService.js';
import { Rating } from '../models/Rating.js';

export class RatingService {
  /**
   * Submit rating for a completed issue
   * @param {string} issueId - The issue ID
   * @param {number} rating - Rating value (1-5)
   * @param {string} feedback - Optional feedback text
   * @param {string} studentId - The student who is rating
   */
  static async submitRating(issueId, rating, feedback, studentId) {
    // Validate rating
    if (!rating || rating < RATING_SCALE.MIN || rating > RATING_SCALE.MAX) {
      throw new Error(`Rating must be between ${RATING_SCALE.MIN} and ${RATING_SCALE.MAX}`);
    }

    // Get issue
    const issueDoc = await db.collection(COLLECTIONS.ISSUES).doc(issueId).get();
    if (!issueDoc.exists) {
      throw new Error('Issue not found');
    }

    const issue = issueDoc.data();

    // Validate that issue is completed
    if (issue.status !== 'completed') {
      throw new Error('Can only rate completed issues');
    }

    // Validate that student owns the issue
    if (issue.studentId !== studentId && issue.createdBy !== studentId) {
      throw new Error('Only the student who created the issue can rate it');
    }

    // Validate that issue hasn't been rated yet
    const existingRating = await db
      .collection(COLLECTIONS.RATINGS)
      .where('issueId', '==', issueId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();
    
    if (!existingRating.empty) {
      throw new Error('This issue has already been rated by you');
    }

    // Validate that worker is assigned
    if (!issue.assignedWorkerId) {
      throw new Error('Issue must have an assigned worker to rate');
    }

    const workerId = issue.assignedWorkerId;

    // Create rating document
    const ratingData = new Rating({
      issueId,
      studentId,
      workerId,
      rating,
      feedback: feedback || '',
    });

    const validation = Rating.validate(ratingData.toFirestore());
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Save rating to ratings collection
    const ratingRef = await db.collection(COLLECTIONS.RATINGS).add(ratingData.toFirestore());

    // Update issue to mark as rated (for quick lookup)
    await db.collection(COLLECTIONS.ISSUES).doc(issueId).update({
      ratedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update worker's rating statistics
    const worker = await UserService.getUserById(workerId);
    if (!worker) {
      throw new Error('Worker not found');
    }

    const currentNoOfRatings = worker.noOfRatings || 0;
    const currentRating = worker.rating || 0;

    // Calculate new average rating
    const totalRating = currentRating * currentNoOfRatings + rating;
    const newNoOfRatings = currentNoOfRatings + 1;
    const newAverageRating = totalRating / newNoOfRatings;

    // Update worker's rating
    await db.collection(COLLECTIONS.USERS).doc(workerId).update({
      noOfRatings: newNoOfRatings,
      rating: parseFloat(newAverageRating.toFixed(2)), // Round to 2 decimal places
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      ratingId: ratingRef.id,
      issueId,
      rating,
      feedback: feedback || '',
      workerId,
      workerNewRating: parseFloat(newAverageRating.toFixed(2)),
      workerNewNoOfRatings: newNoOfRatings,
    };
  }

  /**
   * Get unrated completed issues for a student
   * @param {string} studentId - The student ID
   */
  static async getUnratedIssues(studentId) {
    // Get all completed issues for this student
    const issuesSnapshot = await db
      .collection(COLLECTIONS.ISSUES)
      .where('studentId', '==', studentId)
      .where('status', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(50)
      .get();

    // Get all ratings for this student
    const ratingsSnapshot = await db
      .collection(COLLECTIONS.RATINGS)
      .where('studentId', '==', studentId)
      .get();

    // Create a set of rated issue IDs
    const ratedIssueIds = new Set(ratingsSnapshot.docs.map(doc => doc.data().issueId));

    // Filter out issues that have been rated
    const unratedIssues = issuesSnapshot.docs
      .filter(doc => !ratedIssueIds.has(doc.id))
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

    return unratedIssues.slice(0, 10); // Return top 10
  }

  /**
   * Get rating for a specific issue
   * @param {string} issueId - The issue ID
   */
  static async getRatingByIssueId(issueId) {
    const ratingSnapshot = await db
      .collection(COLLECTIONS.RATINGS)
      .where('issueId', '==', issueId)
      .limit(1)
      .get();

    if (ratingSnapshot.empty) {
      return null;
    }

    const ratingDoc = ratingSnapshot.docs[0];
    return {
      id: ratingDoc.id,
      ...ratingDoc.data(),
    };
  }
}
