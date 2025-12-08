import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { validateId, validatePagination } from "../middleware/validator.js";
import { NotificationController } from "../controllers/notificationController.js";

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get(
  "/",
  verifyToken,
  validatePagination,
  NotificationController.getUserNotifications
);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get("/unread/count", verifyToken, NotificationController.getUnreadCount);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put(
  "/:id/read",
  verifyToken,
  validateId,
  NotificationController.markAsRead
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", verifyToken, NotificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete(
  "/:id",
  verifyToken,
  validateId,
  NotificationController.deleteNotification
);

export default router;
