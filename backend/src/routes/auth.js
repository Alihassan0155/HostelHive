import express from "express";
import axios from "axios";
import bcrypt from "bcryptjs";
import { verifyToken } from "../middleware/auth.js";
import { auth, db } from "../config/firebase.js";
import { UserService } from "../services/userService.js";
import { HostelService } from "../services/hostelService.js";
import { COLLECTIONS, USER_ROLES } from "../config/constants.js";
import { User } from "../models/User.js";

const router = express.Router();

// 🏆 Register (Signup)
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      hostelId, // Can be hostel ID or "new" for creating new hostel
      hostelName, // For creating new hostel
      roomNumber,
      hostelAddress,
      hostelTotalRooms,
      skills,
      hostelIds, // Array of hostel IDs for workers
      availability,
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phoneNumber || !role) {
      return res.status(400).json({
        error: "Email, password, firstName, lastName, phoneNumber, and role are required",
      });
    }

    // Validate role-specific fields
    if (role === USER_ROLES.STUDENT && (!hostelId || !roomNumber)) {
      return res.status(400).json({
        error: "Hostel and room number are required for students",
      });
    }

    if (role === USER_ROLES.ADMIN && !hostelId) {
      return res.status(400).json({
        error: "Hostel is required for admins",
      });
    }

    if (role === USER_ROLES.WORKER && (!hostelIds || hostelIds.length === 0)) {
      return res.status(400).json({
        error: "At least one hostel is required for workers",
      });
    }

    // Handle hostel lookup/creation based on role
    let finalHostelId = null;

    if (role === USER_ROLES.STUDENT) {
      // For students: Use provided hostelId
      if (hostelId === 'new') {
        return res.status(400).json({
          error: "Students must select an existing hostel",
        });
      }
      finalHostelId = hostelId;
    } else if (role === USER_ROLES.ADMIN) {
      // For admin: Check if creating new hostel or using existing
      if (hostelId === 'new') {
        // Creating new hostel - validate required fields
        if (!hostelName || !hostelAddress || !hostelTotalRooms) {
          return res.status(400).json({
            error: "Hostel name, address, and total rooms are required to create a new hostel",
          });
        }

        // Create new hostel (adminId will be set after user creation)
        const newHostel = await HostelService.createHostel({
          name: hostelName,
          address: hostelAddress,
          totalRooms: parseInt(hostelTotalRooms, 10),
          adminId: null, // Will be set after user creation
          workers: [],
        });

        finalHostelId = newHostel.id;
      } else {
        // Using existing hostel
        finalHostelId = hostelId;
      }
    }

    // Create user in Firebase Auth
    const fullName = `${firstName} ${lastName}`;
    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName: fullName,
      });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        return res.status(409).json({
          error: "Email already registered",
        });
      }
      throw error;
    }

    // Create user document in Firestore
    const userData = {
      name: fullName,
      firstName,
      lastName,
      email,
      phoneNumber,
      role,
      hostelId:
        role === USER_ROLES.STUDENT || role === USER_ROLES.ADMIN
          ? finalHostelId
          : null,
      roomNumber: role === USER_ROLES.STUDENT ? roomNumber : null,
      skills: role === USER_ROLES.WORKER ? skills || [] : null,
      hostels: role === USER_ROLES.WORKER ? hostelIds || [] : null,
      availability: role === USER_ROLES.WORKER ? availability || {} : null,
      isAvailable: role === USER_ROLES.WORKER ? true : null,
    };

    const user = new User(userData);
    const validation = User.validate(userData);

    if (!validation.isValid) {
      // Delete Firebase Auth user if Firestore creation fails
      await auth.deleteUser(firebaseUser.uid);
      return res.status(400).json({
        error: validation.errors.join(", "),
      });
    }

    await db
      .collection(COLLECTIONS.USERS)
      .doc(firebaseUser.uid)
      .set(user.toFirestore());

    // If admin, update hostel with adminId
    if (role === USER_ROLES.ADMIN && finalHostelId) {
      await HostelService.updateHostel(finalHostelId, {
        adminId: firebaseUser.uid,
      });
    }

    // If worker, add worker to all selected hostels
    if (role === USER_ROLES.WORKER && hostelIds && hostelIds.length > 0) {
      for (const hId of hostelIds) {
        try {
          await HostelService.addWorker(hId, firebaseUser.uid);
        } catch (error) {
          console.error(`Error adding worker to hostel ${hId}:`, error);
          // Continue with other hostels even if one fails
        }
      }
    }

    // Get custom token for client
    const customToken = await auth.createCustomToken(firebaseUser.uid);

    res.status(201).json({
      message: "User registered successfully ✅",
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      customToken,
      userData: {
        id: firebaseUser.uid,
        ...user.toFirestore(),
      },
    });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Login
// router.post("/login", async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     if (!idToken) {
//       return res.status(400).json({
//         error: "ID token is required. Please sign in with Firebase Auth first.",
//       });
//     }

//     // Verify the ID token
//     const decodedToken = await auth.verifyIdToken(idToken);

//     // Get user data from Firestore
//     const user = await UserService.getUserById(decodedToken.uid);

//     res.status(200).json({
//       message: "Login successful ✅",
//       uid: decodedToken.uid,
//       email: decodedToken.email,
//       userData: user,
//     });
//   } catch (error) {
//     console.error("❌ Error logging in:", error);
//     if (
//       error.code === "auth/invalid-credential" ||
//       error.code === "auth/user-not-found"
//     ) {
//       return res.status(401).json({
//         error: "Invalid email or password",
//       });
//     }
//     res.status(500).json({
//       error: error.response?.data || error.message,
//     });
//   }
// });


// Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    // Use Firebase REST API to sign in
    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) throw new Error("FIREBASE_API_KEY not set");

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    const response = await axios.post(url, { email, password, returnSecureToken: true });

    const { localId, idToken } = response.data;

    // Get Firestore user data
    const userDoc = await db.collection("users").doc(localId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    res.status(200).json({
      success: true,
      message: "Login successful ✅",
      user: { id: localId, ...userData },
      idToken,
    });
  } catch (err) {
    console.error("❌ Login error:", err.response?.data || err.message);
    res.status(401).json({ success: false, error: "Invalid email or password" });
  }
});

// 🏆 Get Current User
router.get("/me", verifyToken(), async (req, res) => {
  try {
    const user = await UserService.getUserById(req.user.uid);

    res.status(200).json({
      uid: req.user.uid,
      email: req.user.email,
      userData: user,
    });
  } catch (error) {
    console.error("❌ Error getting current user:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// 🏆 Logout
router.post("/logout", verifyToken(), async (req, res) => {
  try {
    // Firebase Auth handles logout on client side
    // This endpoint can be used for server-side cleanup if needed
    res.status(200).json({
      message: "Logout successful ✅",
    });
  } catch (error) {
    console.error("❌ Error logging out:", error);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

export default router;
