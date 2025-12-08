import { auth } from "../config/firebase.js";
import { USER_ROLES } from "../config/constants.js";

/**
 * Middleware to verify Firebase ID token
 * Usage: verifyToken(["student", "admin"]) or verifyToken() for any role
 */
export const verifyToken = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "No token provided. Authorization header must be: Bearer <token>",
        });
      }

      const token = authHeader.split("Bearer ")[1];

      // Verify the token
      const decodedToken = await auth.verifyIdToken(token);

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };

      // Get user role from Firestore
      const { db } = await import("../config/firebase.js");
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          error: "User not found in database",
        });
      }

      req.user.role = userDoc.data().role;
      req.user.userData = userDoc.data();

      // Check if role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        });
      }

      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }
  };
};

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(USER_ROLES.ADMIN);

/**
 * Middleware to check if user is student
 */
export const requireStudent = requireRole(USER_ROLES.STUDENT);

/**
 * Middleware to check if user is worker
 */
export const requireWorker = requireRole(USER_ROLES.WORKER);

/**
 * Middleware to check if user is admin or worker
 */
export const requireAdminOrWorker = requireRole(
  USER_ROLES.ADMIN,
  USER_ROLES.WORKER
);

/**
 * Middleware to check if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdField = "userId") => {
  return async (req, res, next) => {
    try {
      const { db } = await import("../../config/firebase.js");
      const resourceId = req.params.id;
      const resourceDoc = await db
        .collection(req.resourceCollection || "issues")
        .doc(resourceId)
        .get();

      if (!resourceDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      const resourceData = resourceDoc.data();
      const resourceUserId = resourceData[resourceUserIdField];

      // Allow if user owns the resource or is admin
      if (
        req.user.uid === resourceUserId ||
        req.user.role === USER_ROLES.ADMIN
      ) {
        req.resourceData = resourceData;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error checking resource ownership",
        error: error.message,
      });
    }
  };
};
