import { auth, db } from "../config/firebase.js";
import { UserService } from "../services/userService.js";
import { successResponse, errorResponse } from "../utils/helpers.js";
import { COLLECTIONS, USER_ROLES } from "../config/constants.js";
import { User } from "../models/User.js";

export class AuthController {
  /**
   * Register new user (Signup)
   */
  static async register(req, res, next) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role,
        hostelName,
        roomNumber,
        hostelAddress,
        hostelTotalRooms,
        skills,
        hostels,
        availability,
      } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        const { response, statusCode } = errorResponse(
          "Email, password, firstName, lastName, and role are required",
          400
        );
        return res.status(statusCode).json(response);
      }

      // Validate role-specific fields
      if (role === USER_ROLES.STUDENT && (!hostelName || !roomNumber)) {
        const { response, statusCode } = errorResponse(
          "Hostel name and room number are required for students",
          400
        );
        return res.status(statusCode).json(response);
      }

      if (role === USER_ROLES.ADMIN && !hostelName) {
        const { response, statusCode } = errorResponse(
          "Hostel name is required for admins",
          400
        );
        return res.status(statusCode).json(response);
      }

      // Handle hostel lookup/creation based on role
      let hostelId = null;
      const { HostelService } = await import("../services/hostelService.js");

      if (role === USER_ROLES.STUDENT) {
        // For students: Find hostel by name, get ID
        try {
          const hostel = await HostelService.getHostelByName(hostelName);

          if (!hostel) {
            const { response, statusCode } = errorResponse(
              `Hostel "${hostelName}" not found. Please check the hostel name.`,
              404
            );
            return res.status(statusCode).json(response);
          }

          hostelId = hostel.id;
        } catch (error) {
          const { response, statusCode } = errorResponse(
            "Error finding hostel",
            500
          );
          return res.status(statusCode).json(response);
        }
      } else if (role === USER_ROLES.ADMIN) {
        // For admin: Find hostel by name, if not found create it
        try {
          let hostel = await HostelService.getHostelByName(hostelName);

          if (!hostel) {
            // Hostel doesn't exist, admin must provide all details to create it
            if (!hostelAddress || !hostelTotalRooms) {
              const { response, statusCode } = errorResponse(
                `Hostel "${hostelName}" not found. Please provide hostel details: address and totalRooms are required to create a new hostel.`,
                400
              );
              return res.status(statusCode).json(response);
            }

            // Create new hostel
            const newHostel = await HostelService.createHostel({
              name: hostelName,
              address: hostelAddress,
              totalRooms: parseInt(hostelTotalRooms, 10),
              adminId: null, // Will be set after user creation
              workers: [],
            });

            hostelId = newHostel.id;
          } else {
            hostelId = hostel.id;
          }
        } catch (error) {
          const { response, statusCode } = errorResponse(
            error.message || "Error processing hostel",
            500
          );
          return res.status(statusCode).json(response);
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
          const { response, statusCode } = errorResponse(
            "Email already registered",
            409
          );
          return res.status(statusCode).json(response);
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
            ? hostelId
            : null,
        roomNumber: role === USER_ROLES.STUDENT ? roomNumber : null,
        skills: role === USER_ROLES.WORKER ? skills || [] : null,
        hostels: role === USER_ROLES.WORKER ? hostels || [] : null,
        availability: role === USER_ROLES.WORKER ? availability || {} : null,
        isAvailable: role === USER_ROLES.WORKER ? true : null,
      };

      const user = new User(userData);
      const validation = User.validate(userData);

      if (!validation.isValid) {
        // Delete Firebase Auth user if Firestore creation fails
        await auth.deleteUser(firebaseUser.uid);
        const { response, statusCode } = errorResponse(
          validation.errors.join(", "),
          400
        );
        return res.status(statusCode).json(response);
      }

      await db
        .collection(COLLECTIONS.USERS)
        .doc(firebaseUser.uid)
        .set(user.toFirestore());

      // If admin, update hostel with adminId
      if (role === USER_ROLES.ADMIN && hostelId) {
        await HostelService.updateHostel(hostelId, {
          adminId: firebaseUser.uid,
        });
      }

      // Get custom token for client
      const customToken = await auth.createCustomToken(firebaseUser.uid);

      const { response, statusCode } = successResponse(
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          customToken,
          userData: {
            id: firebaseUser.uid,
            ...user.toFirestore(),
          },
        },
        "User registered successfully",
        201
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        const { response, statusCode } = errorResponse(
          "Email and password are required",
          400
        );
        return res.status(statusCode).json(response);
      }

      // Note: Firebase Admin SDK doesn't have a login method
      // The client should use Firebase Auth SDK to sign in
      // This endpoint verifies the token and returns user data
      const { idToken } = req.body;

      if (!idToken) {
        const { response, statusCode } = errorResponse(
          "ID token is required. Please sign in with Firebase Auth first.",
          400
        );
        return res.status(statusCode).json(response);
      }

      // Verify the ID token
      const decodedToken = await auth.verifyIdToken(idToken);

      // Get user data from Firestore
      const user = await UserService.getUserById(decodedToken.uid);

      const { response, statusCode } = successResponse(
        {
          uid: decodedToken.uid,
          email: decodedToken.email,
          userData: user,
        },
        "Login successful"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found"
      ) {
        const { response, statusCode } = errorResponse(
          "Invalid email or password",
          401
        );
        return res.status(statusCode).json(response);
      }
      next(error);
    }
  }

  /**
   * Verify token and get user
   */
  static async verifyToken(req, res, next) {
    try {
      // This is handled by verifyToken middleware
      // Just return the user data
      const user = await UserService.getUserById(req.user.uid);
      const { response, statusCode } = successResponse({
        uid: req.user.uid,
        email: req.user.email,
        userData: user,
      });
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout (client-side, but we can track it)
   */
  static async logout(req, res, next) {
    try {
      // Firebase Auth handles logout on client side
      // This endpoint can be used for server-side cleanup if needed
      const { response, statusCode } = successResponse(
        null,
        "Logout successful"
      );
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }
}
