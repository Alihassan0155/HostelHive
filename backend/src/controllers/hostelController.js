import { HostelService } from "../services/hostelService.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

export class HostelController {
  /**
   * Get hostel by ID
   */
  static async getHostelById(req, res, next) {
    try {
      const { id } = req.params;
      const hostel = await HostelService.getHostelById(id);
      const { response, statusCode } = successResponse(hostel);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all hostels
   */
  static async getHostels(req, res, next) {
    try {
      const hostels = await HostelService.getHostels();
      const { response, statusCode } = successResponse(hostels);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create hostel
   */
  static async createHostel(req, res, next) {
    try {
      const hostel = await HostelService.createHostel(req.body);
      const { response, statusCode } = successResponse(
        hostel,
        "Hostel created successfully",
        201
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update hostel
   */
  static async updateHostel(req, res, next) {
    try {
      const { id } = req.params;
      const hostel = await HostelService.updateHostel(id, req.body);
      const { response, statusCode } = successResponse(
        hostel,
        "Hostel updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete hostel
   */
  static async deleteHostel(req, res, next) {
    try {
      const { id } = req.params;
      await HostelService.deleteHostel(id);
      const { response, statusCode } = successResponse(
        null,
        "Hostel deleted successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add worker to hostel
   */
  static async addWorker(req, res, next) {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      const hostel = await HostelService.addWorker(id, workerId);
      const { response, statusCode } = successResponse(
        hostel,
        "Worker added to hostel successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove worker from hostel
   */
  static async removeWorker(req, res, next) {
    try {
      const { id } = req.params;
      const { workerId } = req.body;
      const hostel = await HostelService.removeWorker(id, workerId);
      const { response, statusCode } = successResponse(
        hostel,
        "Worker removed from hostel successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}
