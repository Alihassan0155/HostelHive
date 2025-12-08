import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { HostelService } from "../services/hostelService.js";

const router = express.Router();

// 🏆 Get All Hostels (Public - for signup page)
router.get("/public", async (req, res) => {
  try {
    const hostels = await HostelService.getHostels();
    res.status(200).json({
      hostels,
      count: hostels.length,
    });
  } catch (error) {
    console.error("❌ Error getting hostels:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Get All Hostels (Authenticated)
router.get("/", verifyToken(), async (req, res) => {
  try {
    const hostels = await HostelService.getHostels();

    res.status(200).json({
      hostels,
      count: hostels.length,
    });
  } catch (error) {
    console.error("❌ Error getting hostels:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Get Hostel by ID
router.get("/:id", verifyToken(), async (req, res) => {
  try {
    const { id } = req.params;
    const hostel = await HostelService.getHostelById(id);

    res.status(200).json({
      hostel,
    });
  } catch (error) {
    console.error("❌ Error getting hostel:", error);
    if (error.message === "Hostel not found") {
      return res.status(404).json({
        error: "Hostel not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Create Hostel (Admin Only)
router.post("/", verifyToken(["admin"]), async (req, res) => {
  try {
    const { name, address, totalRooms, adminId } = req.body;

    if (!name || !address || !totalRooms) {
      return res.status(400).json({
        error: "Name, address, and totalRooms are required",
      });
    }

    const hostel = await HostelService.createHostel({
      name,
      address,
      totalRooms: parseInt(totalRooms, 10),
      adminId: adminId || req.user.uid,
      workers: [],
    });

    res.status(201).json({
      message: "Hostel created successfully ✅",
      hostel,
    });
  } catch (error) {
    console.error("❌ Error creating hostel:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Update Hostel (Admin Only)
router.put("/:id", verifyToken(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const hostel = await HostelService.updateHostel(id, req.body);

    res.status(200).json({
      message: "Hostel updated successfully ✅",
      hostel,
    });
  } catch (error) {
    console.error("❌ Error updating hostel:", error);
    if (error.message === "Hostel not found") {
      return res.status(404).json({
        error: "Hostel not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Delete Hostel (Admin Only)
router.delete("/:id", verifyToken(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    await HostelService.deleteHostel(id);

    res.status(200).json({
      message: "Hostel deleted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Error deleting hostel:", error);
    if (error.message === "Hostel not found") {
      return res.status(404).json({
        error: "Hostel not found",
      });
    }
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Add Worker to Hostel (Admin Only)
router.post("/:id/workers", verifyToken(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        error: "workerId is required",
      });
    }

    const hostel = await HostelService.addWorker(id, workerId);

    res.status(200).json({
      message: "Worker added to hostel successfully ✅",
      hostel,
    });
  } catch (error) {
    console.error("❌ Error adding worker to hostel:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Remove Worker from Hostel (Admin Only)
router.delete("/:id/workers", verifyToken(["admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        error: "workerId is required",
      });
    }

    const hostel = await HostelService.removeWorker(id, workerId);

    res.status(200).json({
      message: "Worker removed from hostel successfully ✅",
      hostel,
    });
  } catch (error) {
    console.error("❌ Error removing worker from hostel:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

export default router;
