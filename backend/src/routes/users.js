import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { UserService } from "../services/userService.js";
import { db } from "../config/firebase.js";
import { COLLECTIONS } from "../config/constants.js";

const router = express.Router();

// 🏆 Get All Users (Admin Only)
router.get("/", verifyToken(["admin"]), async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      hostelId: req.query.hostelId,
    };

    const users = await UserService.getUsers(filters);

    res.status(200).json({
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("❌ Error getting users:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Get User by ID
router.get("/:id", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.getUserById(id);

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("❌ Error getting user:", error);
    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Update User
router.put("/:id", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;

    // Users can only update themselves unless they're admin
    if (req.user.uid !== id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "You can only update your own profile",
      });
    }

    const user = await UserService.updateUser(id, req.body);

    res.status(200).json({
      message: "User updated successfully ✅",
      user,
    });
  } catch (error) {
    console.error("❌ Error updating user:", error);
    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Delete User (Admin Only)
router.delete("/:id", verifyToken(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await UserService.deleteUser(id);

    res.status(200).json({
      message: "User deleted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    if (error.message === "User not found") {
      return res.status(404).json({
        error: "User not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Get Workers by Hostel
router.get("/hostels/:hostelId/workers", verifyToken(), async (req, res) => {
  try {
    const { hostelId } = req.params;
    const workers = await UserService.getWorkersByHostel(hostelId);

    res.status(200).json({
      workers,
      count: workers.length,
    });
  } catch (error) {
    console.error("❌ Error getting workers by hostel:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Get Workers by Skill
router.get("/skills/:skill/workers", verifyToken(), async (req, res) => {
  try {
    const { skill } = req.params;
    const workers = await UserService.getWorkersBySkill(skill);

    res.status(200).json({
      workers,
      count: workers.length,
    });
  } catch (error) {
    console.error("❌ Error getting workers by skill:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Update Worker Availability
router.put("/:id/availability", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;

    // Only workers can update their own availability, or admins
    if (req.user.uid !== id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const worker = await UserService.updateWorkerAvailability(id, availability);

    res.status(200).json({
      message: "Availability updated successfully ✅",
      worker,
    });
  } catch (error) {
    console.error("❌ Error updating worker availability:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Set Worker Status (Available/Unavailable)
router.put("/:id/status", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    // Only workers can update their own status, or admins
    if (req.user.uid !== id && req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
      });
    }

    const worker = await UserService.setWorkerStatus(id, isAvailable);

    res.status(200).json({
      message: "Worker status updated successfully ✅",
      worker,
    });
  } catch (error) {
    console.error("❌ Error updating worker status:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

export default router;
