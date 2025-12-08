import { RatingService } from "../services/ratingService.js";
import { successResponse, errorResponse } from "../utils/helpers.js";
import { USER_ROLES } from "../config/constants.js";

export class RatingController {
  /**
   * Get rating by ID
   */
  static async getRatingById(req, res, next) {
    try {
      const { id } = req.params;
      const rating = await RatingService.getRatingById(id);
      const { response, statusCode } = successResponse(rating);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ratings
   */
  static async getRatings(req, res, next) {
    try {
      const filters = {};

      if (req.query.workerId) filters.workerId = req.query.workerId;
      if (req.query.issueId) filters.issueId = req.query.issueId;
      if (req.query.studentId) filters.studentId = req.query.studentId;

      const ratings = await RatingService.getRatings(filters);
      const { response, statusCode } = successResponse(ratings);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create rating
   */
  static async createRating(req, res, next) {
    try {
      // Only students can create ratings
      if (req.user.role !== USER_ROLES.STUDENT) {
        const { response, statusCode } = errorResponse(
          "Only students can create ratings",
          403
        );
        return res.status(statusCode).json(response);
      }

      const ratingData = {
        ...req.body,
        studentId: req.user.uid,
      };

      const rating = await RatingService.createRating(ratingData);
      const { response, statusCode } = successResponse(
        rating,
        "Rating created successfully",
        201
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get worker average rating
   */
  static async getWorkerAverageRating(req, res, next) {
    try {
      const { id } = req.params;
      const ratingData = await RatingService.getWorkerAverageRating(id);
      const { response, statusCode } = successResponse(ratingData);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update rating
   */
  static async updateRating(req, res, next) {
    try {
      const { id } = req.params;
      const rating = await RatingService.getRatingById(id);

      // Only the student who created the rating can update it
      if (rating.studentId !== req.user.uid && req.user.role !== "admin") {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      const updatedRating = await RatingService.updateRating(id, req.body);
      const { response, statusCode } = successResponse(
        updatedRating,
        "Rating updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete rating
   */
  static async deleteRating(req, res, next) {
    try {
      const { id } = req.params;
      await RatingService.deleteRating(id);
      const { response, statusCode } = successResponse(
        null,
        "Rating deleted successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}
