import { IssueService } from "../services/issueService.js";
import { successResponse, errorResponse } from "../utils/helpers.js";
import { USER_ROLES } from "../config/constants.js";

export class IssueController {
  /**
   * Get issue by ID
   */
  static async getIssueById(req, res, next) {
    try {
      const { id } = req.params;
      const issue = await IssueService.getIssueById(id);

      // Check access: students can only see their own issues, admins/workers can see all
      if (
        req.user.role === USER_ROLES.STUDENT &&
        issue.studentId !== req.user.uid
      ) {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      const { response, statusCode } = successResponse(issue);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get issues
   */
  static async getIssues(req, res, next) {
    try {
      const filters = {};

      // Students can only see their own issues
      if (req.user.role === USER_ROLES.STUDENT) {
        filters.studentId = req.user.uid;
      }

      // Workers can only see their assigned issues
      if (req.user.role === USER_ROLES.WORKER) {
        filters.assignedWorkerId = req.user.uid;
      }

      // Admins can see all issues in their hostel
      if (req.user.role === USER_ROLES.ADMIN && req.user.userData.hostelId) {
        filters.hostelId = req.user.userData.hostelId;
      }

      // Apply query filters
      if (req.query.status) filters.status = req.query.status;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.urgency) filters.urgency = req.query.urgency;
      if (req.query.hostelId && req.user.role === USER_ROLES.ADMIN) {
        filters.hostelId = req.query.hostelId;
      }

      const pagination = {
        limit: parseInt(req.query.limit, 10) || 20,
        startAfter: req.query.startAfter,
      };

      const issues = await IssueService.getIssues(filters, pagination);
      const { response, statusCode } = successResponse(issues);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create issue
   */
  static async createIssue(req, res, next) {
    try {
      // Only students can create issues
      if (req.user.role !== USER_ROLES.STUDENT) {
        const { response, statusCode } = errorResponse(
          "Only students can create issues",
          403
        );
        return res.status(statusCode).json(response);
      }

      const issueData = {
        ...req.body,
        studentId: req.user.uid,
        createdBy: req.user.uid, // Store the userId who created the issue
      };

      const issue = await IssueService.createIssue(issueData);
      const { response, statusCode } = successResponse(
        issue,
        "Issue created successfully",
        201
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update issue
   */
  static async updateIssue(req, res, next) {
    try {
      const { id } = req.params;
      const issue = await IssueService.getIssueById(id);

      // Check access
      if (
        req.user.role === USER_ROLES.STUDENT &&
        issue.studentId !== req.user.uid
      ) {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      const updatedIssue = await IssueService.updateIssue(id, req.body);
      const { response, statusCode } = successResponse(
        updatedIssue,
        "Issue updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign worker to issue
   */
  static async assignWorker(req, res, next) {
    try {
      const { id } = req.params;
      const { workerId, scheduledTime } = req.body;

      // Only admins can assign workers
      if (req.user.role !== USER_ROLES.ADMIN) {
        const { response, statusCode } = errorResponse(
          "Only admins can assign workers",
          403
        );
        return res.status(statusCode).json(response);
      }

      const issue = await IssueService.assignWorker(
        id,
        workerId,
        scheduledTime
      );
      const { response, statusCode } = successResponse(
        issue,
        "Worker assigned successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update issue status
   */
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const issue = await IssueService.getIssueById(id);

      // Check access
      if (req.user.role === USER_ROLES.STUDENT) {
        const { response, statusCode } = errorResponse(
          "Students cannot update issue status",
          403
        );
        return res.status(statusCode).json(response);
      }

      // Workers can only update their own assigned issues
      if (
        req.user.role === USER_ROLES.WORKER &&
        issue.assignedWorkerId !== req.user.uid
      ) {
        const { response, statusCode } = errorResponse(
          "You can only update your assigned issues",
          403
        );
        return res.status(statusCode).json(response);
      }

      const updatedIssue = await IssueService.updateStatus(
        id,
        status,
        req.user.uid
      );
      const { response, statusCode } = successResponse(
        updatedIssue,
        "Status updated successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm issue is fixed
   */
  static async confirmFix(req, res, next) {
    try {
      const { id } = req.params;
      const { isFixed } = req.body;

      // Only students can confirm fixes
      if (req.user.role !== USER_ROLES.STUDENT) {
        const { response, statusCode } = errorResponse(
          "Only students can confirm fixes",
          403
        );
        return res.status(statusCode).json(response);
      }

      const issue = await IssueService.getIssueById(id);

      // Check ownership
      if (issue.studentId !== req.user.uid) {
        const { response, statusCode } = errorResponse(
          "You can only confirm your own issues",
          403
        );
        return res.status(statusCode).json(response);
      }

      const updatedIssue = await IssueService.confirmFix(id, isFixed);
      const { response, statusCode } = successResponse(
        updatedIssue,
        isFixed ? "Issue confirmed as fixed" : "Issue reopened"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add worker update (notes/photos)
   */
  static async addWorkerUpdate(req, res, next) {
    try {
      const { id } = req.params;
      const { notes, photos } = req.body;

      // Only workers can add updates
      if (req.user.role !== USER_ROLES.WORKER) {
        const { response, statusCode } = errorResponse(
          "Only workers can add updates",
          403
        );
        return res.status(statusCode).json(response);
      }

      const issue = await IssueService.addWorkerUpdate(
        id,
        req.user.uid,
        notes,
        photos
      );
      const { response, statusCode } = successResponse(
        issue,
        "Update added successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get urgent issues
   */
  static async getUrgentIssues(req, res, next) {
    try {
      const hostelId =
        req.user.role === USER_ROLES.ADMIN ? req.user.userData.hostelId : null;
      const issues = await IssueService.getUrgentIssues(hostelId);
      const { response, statusCode } = successResponse(issues);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}
