import { NotificationService } from "../services/notificationService.js";
import { successResponse, errorResponse } from "../utils/helpers.js";

export class NotificationController {
  /**
   * Get user notifications
   */
  static async getUserNotifications(req, res, next) {
    try {
      const filters = {
        read:
          req.query.read === "true"
            ? true
            : req.query.read === "false"
            ? false
            : undefined,
        limit: parseInt(req.query.limit, 10) || 50,
      };

      const notifications = await NotificationService.getUserNotifications(
        req.user.uid,
        filters
      );
      const { response, statusCode } = successResponse(notifications);
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.uid);
      const { response, statusCode } = successResponse({ count });
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await NotificationService.getNotificationById(id);

      // Check ownership
      if (notification.userId !== req.user.uid) {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      const updatedNotification = await NotificationService.markAsRead(id);
      const { response, statusCode } = successResponse(
        updatedNotification,
        "Notification marked as read"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user.uid);
      const { response, statusCode } = successResponse(
        result,
        "All notifications marked as read"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await NotificationService.getNotificationById(id);

      // Check ownership
      if (notification.userId !== req.user.uid) {
        const { response, statusCode } = errorResponse("Access denied", 403);
        return res.status(statusCode).json(response);
      }

      await NotificationService.deleteNotification(id);
      const { response, statusCode } = successResponse(
        null,
        "Notification deleted successfully"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}
