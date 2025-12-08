import { body, param, query, validationResult } from "express-validator";
import {
  ISSUE_TYPES,
  USER_ROLES,
  WORKER_SKILLS,
} from "../config/constants.js";

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// User validation rules
export const validateUserRegister = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("role")
    .isIn(Object.values(USER_ROLES))
    .withMessage(
      `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`
    ),
  body("hostelId")
    .optional()
    .isString()
    .withMessage("Hostel ID must be a string"),
  body("roomNumber")
    .if(body("role").equals(USER_ROLES.STUDENT))
    .notEmpty()
    .withMessage("Room number is required for students"),
  body("skills")
    .if(body("role").equals(USER_ROLES.WORKER))
    .isArray()
    .withMessage("Skills must be an array"),
  body("skills.*")
    .if(body("role").equals(USER_ROLES.WORKER))
    .isIn(Object.values(WORKER_SKILLS))
    .withMessage("Invalid skill"),
  validate,
];

export const validateUserUpdate = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("roomNumber")
    .optional()
    .isString()
    .withMessage("Room number must be a string"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("availability")
    .optional()
    .isObject()
    .withMessage("Availability must be an object"),
  validate,
];

// Hostel validation rules
export const validateHostelCreate = [
  body("name").trim().notEmpty().withMessage("Hostel name is required"),
  body("address").trim().notEmpty().withMessage("Address is required"),
  body("totalRooms")
    .isInt({ min: 1 })
    .withMessage("Total rooms must be a positive integer"),
  body("adminId")
    .optional()
    .isString()
    .withMessage("Admin ID must be a string"),
  validate,
];

export const validateHostelUpdate = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Hostel name cannot be empty"),
  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty"),
  body("totalRooms")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total rooms must be a positive integer"),
  validate,
];

// Issue validation rules
export const validateIssueCreate = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("type")
    .isIn(Object.values(ISSUE_TYPES))
    .withMessage(
      `Type must be one of: ${Object.values(ISSUE_TYPES).join(", ")}`
    ),
  body("hostelId").isString().withMessage("Hostel ID is required"),
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("photos").optional().isArray().withMessage("Photos must be an array"),
  validate,
];

export const validateIssueUpdate = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Description cannot be empty"),
  body("status")
    .optional()
    .isIn(["pending", "assigned", "in_progress", "completed", "closed"]),
  validate,
];

export const validateIssueAssign = [
  body("workerId").isString().withMessage("Worker ID is required"),
  body("scheduledTime")
    .optional()
    .isISO8601()
    .withMessage("Scheduled time must be a valid ISO 8601 date"),
  validate,
];

// Rating validation rules
export const validateRatingCreate = [
  body("issueId").isString().withMessage("Issue ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("feedback")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Feedback must be less than 500 characters"),
  validate,
];

// Worker availability validation
export const validateWorkerAvailability = [
  body("availability").isObject().withMessage("Availability must be an object"),
  body("availability.*")
    .isArray()
    .withMessage("Each day must have an array of time slots"),
  body("availability.*.*")
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage("Time slots must be in format HH:MM-HH:MM"),
  validate,
];

// ID parameter validation
export const validateId = [
  param("id").isString().notEmpty().withMessage("Invalid ID"),
  validate,
];

// Query validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  validate,
];
