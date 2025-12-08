import { db } from "../config/firebase.js";
import { COLLECTIONS, USER_ROLES } from "../config/constants.js";
import { User } from "../models/User.js";

export class UserService {
  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    const usersRef = db.collection(COLLECTIONS.USERS);
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();

    if (snapshot.empty) {
      throw new Error("User not found");
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  /**
   * Get all users (with optional filtering)
   */
  static async getUsers(filters = {}) {
    let query = db.collection(COLLECTIONS.USERS);

    if (filters.role) {
      query = query.where("role", "==", filters.role);
    }

    if (filters.hostelId) {
      query = query.where("hostelId", "==", filters.hostelId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    const validation = User.validate(userData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    const user = new User(userData);
    const docRef = await db
      .collection(COLLECTIONS.USERS)
      .add(user.toFirestore());

    return {
      id: docRef.id,
      ...user.toFirestore(),
    };
  }

  /**
   * Update user
   */
  static async updateUser(userId, updateData) {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId);
    const existingUser = await userDoc.get();

    if (!existingUser.exists) {
      throw new Error("User not found");
    }

    const updatedData = {
      ...existingUser.data(),
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    await userDoc.update(updatedData);
    return {
      id: userId,
      ...updatedData,
    };
  }

  /**
   * Delete user
   */
  static async deleteUser(userId) {
    // Import auth here to avoid circular dependency
    const { auth } = await import("../config/firebase.js");
    
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId);
    const exists = await userDoc.get();

    if (!exists.exists) {
      throw new Error("User not found");
    }

    // Delete from Firestore
    await userDoc.delete();

    // Delete from Firebase Authentication
    try {
      await auth.deleteUser(userId);
    } catch (authError) {
      // If user doesn't exist in Auth (might have been deleted already), log but don't fail
      if (authError.code !== "auth/user-not-found") {
        console.error("⚠️ Error deleting user from Firebase Auth:", authError.message);
        // Continue anyway since Firestore deletion succeeded
      }
    }

    return { success: true };
  }

  /**
   * Get workers by hostel
   */
  static async getWorkersByHostel(hostelId) {
    const snapshot = await db
      .collection(COLLECTIONS.USERS)
      .where("role", "==", USER_ROLES.WORKER)
      .where("hostels", "array-contains", hostelId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Get workers by skill
   */
  static async getWorkersBySkill(skill) {
    const snapshot = await db
      .collection(COLLECTIONS.USERS)
      .where("role", "==", USER_ROLES.WORKER)
      .where("skills", "array-contains", skill)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  /**
   * Update worker availability
   */
  static async updateWorkerAvailability(workerId, availability) {
    return this.updateUser(workerId, { availability });
  }

  /**
   * Set worker available/unavailable status
   */
  static async setWorkerStatus(workerId, isAvailable) {
    return this.updateUser(workerId, { isAvailable });
  }
}
