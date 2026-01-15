import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { IssueService } from "../services/issueService.js";
import { RatingService } from "../services/ratingService.js";
import { USER_ROLES } from "../config/constants.js";

const router = express.Router();

// 🏆 Get Issues (filtered by role)
router.get("/", verifyToken(), async (req, res) => {
  try {
    const filters = {};

    // Students can only see their own issues
    if (req.user.role === USER_ROLES.STUDENT) {
      if (!req.user.uid) {
        return res.status(400).json({
          error: "User ID not found",
        });
      }
      filters.studentId = req.user.uid;
    }

    // Workers can only see their assigned issues
    if (req.user.role === USER_ROLES.WORKER) {
      if (!req.user.uid) {
        return res.status(400).json({
          error: "User ID not found",
        });
      }
      filters.assignedWorkerId = req.user.uid;
    }

    // Admins can see all issues in their hostel
    if (req.user.role === USER_ROLES.ADMIN) {
      const hostelId = req.user.userData?.hostelId || req.query.hostelId;
      if (hostelId) {
        filters.hostelId = hostelId;
      } else {
        // If admin has no hostelId, return empty array instead of error
        return res.status(200).json({
          issues: [],
          count: 0,
        });
      }
    }

    // Apply query filters
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.urgency) filters.urgency = req.query.urgency;

    const pagination = {
      limit: parseInt(req.query.limit, 10) || 20,
      startAfter: req.query.startAfter,
    };

    const issues = await IssueService.getIssues(filters, pagination);

    res.status(200).json({
      issues,
      count: issues.length,
    });
  } catch (error) {
    console.error("❌ Error getting issues:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Removed /urgent endpoint - urgency levels no longer exist

// 🏆 Get Issue by ID
router.get("/:id", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await IssueService.getIssueById(id);

    // Check access: students can only see their own issues
    if (
      req.user.role === USER_ROLES.STUDENT &&
      issue.studentId !== req.user.uid
    ) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    res.status(200).json({
      issue,
    });
  } catch (error) {
    console.error("❌ Error getting issue:", error);
    if (error.message === "Issue not found") {
      return res.status(404).json({
        error: "Issue not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Create Issue (Student Only)
router.post("/", verifyToken(["student"]), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      hostelId,
      roomNumber,
      photos,
    } = req.body;

    if (!title || !description || !type || !hostelId || !roomNumber) {
      return res.status(400).json({
        error: "Title, description, type, hostelId, and roomNumber are required",
      });
    }

    const issueData = {
      title,
      description,
      type,
      hostelId,
      roomNumber,
      photos: photos || [],
      studentId: req.user.uid,
      createdBy: req.user.uid, // Store the userId who created the issue
    };

    const issue = await IssueService.createIssue(issueData);

    res.status(201).json({
      message: "Issue created successfully ✅",
      issue,
    });
  } catch (error) {
    console.error("❌ Error creating issue:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Update Issue
router.put("/:id", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await IssueService.getIssueById(id);

    // Check access
    if (
      req.user.role === USER_ROLES.STUDENT &&
      issue.studentId !== req.user.uid
    ) {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const updatedIssue = await IssueService.updateIssue(id, req.body);

    res.status(200).json({
      message: "Issue updated successfully ✅",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("❌ Error updating issue:", error);
    if (error.message === "Issue not found") {
      return res.status(404).json({
        error: "Issue not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Assign Worker to Issue (Admin Only)
router.put("/:id/assign", verifyToken(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        error: "workerId is required",
      });
    }

    const issue = await IssueService.assignWorker(id, workerId);

    res.status(200).json({
      message: "Worker assigned successfully ✅",
      issue,
    });
  } catch (error) {
    console.error("❌ Error assigning worker:", error);
    if (error.message === "Issue not found") {
      return res.status(404).json({
        error: "Issue not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Update Issue Status
router.put("/:id/status", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "status is required",
      });
    }

    const issue = await IssueService.getIssueById(id);

    // Check access
    if (req.user.role === USER_ROLES.STUDENT) {
      return res.status(403).json({
        error: "Students cannot update issue status",
      });
    }

    // Workers can only update their own assigned issues
    if (
      req.user.role === USER_ROLES.WORKER &&
      issue.assignedWorkerId !== req.user.uid
    ) {
      return res.status(403).json({
        error: "You can only update your assigned issues",
      });
    }

    const updatedIssue = await IssueService.updateStatus(
      id,
      status,
      req.user.uid
    );

    res.status(200).json({
      message: "Status updated successfully ✅",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("❌ Error updating issue status:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Confirm Issue Fix (Student Only)
router.put("/:id/confirm", verifyToken(["student"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { isFixed } = req.body;

    if (isFixed === undefined) {
      return res.status(400).json({
        error: "isFixed is required",
      });
    }

    const issue = await IssueService.getIssueById(id);

    // Check ownership
    if (issue.studentId !== req.user.uid) {
      return res.status(403).json({
        error: "You can only confirm your own issues",
      });
    }

    const updatedIssue = await IssueService.confirmFix(id, isFixed);

    res.status(200).json({
      message: isFixed
        ? "Issue confirmed as fixed ✅"
        : "Issue reopened for further work",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("❌ Error confirming issue:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Add Worker Update (Worker Only)
router.put("/:id/update", verifyToken(["worker"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, photos } = req.body;

    const issue = await IssueService.addWorkerUpdate(
      id,
      req.user.uid,
      notes,
      photos
    );

    res.status(200).json({
      message: "Update added successfully ✅",
      issue,
    });
  } catch (error) {
    console.error("❌ Error adding worker update:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Submit Rating (Student Only)
router.post("/:id/rating", verifyToken(["student"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating) {
      return res.status(400).json({
        error: "Rating is required",
      });
    }

    const result = await RatingService.submitRating(id, rating, feedback || '', req.user.uid);

    res.status(200).json({
      message: "Rating submitted successfully ✅",
      ...result,
    });
  } catch (error) {
    console.error("❌ Error submitting rating:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Get Unrated Issues (Student Only)
router.get("/unrated", verifyToken(["student"]), async (req, res) => {
  try {
    const unratedIssues = await RatingService.getUnratedIssues(req.user.uid);

    res.status(200).json({
      issues: unratedIssues,
    });
  } catch (error) {
    console.error("❌ Error fetching unrated issues:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

export default router;
