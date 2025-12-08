import { UserService } from "../services/userService.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

export class UserController {
  /**
   * Get current user
   */
  static async getCurrentUser(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.uid);
      const { response, statusCode } = successResponse(user);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      const { response, statusCode } = successResponse(user);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   */
  static async getUsers(req, res, next) {
    try {
      const filters = {
        role: req.query.role,
        hostelId: req.query.hostelId,
      };

      const users = await UserService.getUsers(filters);
      const { response, statusCode } = successResponse(users);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user
   */
  static async createUser(req, res, next) {
    try {
      const user = await UserService.createUser(req.body);
      const { response, statusCode } = successResponse(
        user,
        "User created successfully",
        201
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      // Users can only update themselves unless they're admin
      if (req.user.uid !== id && req.user.role !== "admin") {
        const { response, statusCode } = errorResponse(
          "You can only update your own profile",
          403
        );
        return res.status(statusCode).json(response);
      }

      const user = await UserService.updateUser(id, req.body);
      const { response, statusCode } = successResponse(
        user,
        "User updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);
      const { response, statusCode } = successResponse(
        null,
        "User deleted successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workers by hostel
   */
  static async getWorkersByHostel(req, res, next) {
    try {
      const { hostelId } = req.params;
      const workers = await UserService.getWorkersByHostel(hostelId);
      const { response, statusCode } = successResponse(workers);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get workers by skill
   */
  static async getWorkersBySkill(req, res, next) {
    try {
      const { skill } = req.params;
      const workers = await UserService.getWorkersBySkill(skill);
      const { response, statusCode } = successResponse(workers);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update worker availability
   */
  static async updateWorkerAvailability(req, res, next) {
    try {
      const { id } = req.params;
      // Only workers can update their own availability, or admins
      if (req.user.uid !== id && req.user.role !== "admin") {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      const worker = await UserService.updateWorkerAvailability(
        id,
        req.body.availability
      );
      const { response, statusCode } = successResponse(
        worker,
        "Availability updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set worker status (available/unavailable)
   */
  static async setWorkerStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;

      // Only workers can update their own status, or admins
      if (req.user.uid !== id && req.user.role !== "admin") {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      const worker = await UserService.setWorkerStatus(id, isAvailable);
      const { response, statusCode } = successResponse(
        worker,
        "Worker status updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}
