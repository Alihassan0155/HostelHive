import { USER_ROLES, WORKER_SKILLS } from "../config/constants.js";

/**
 * User model/schema
 */
export class User {
  constructor(data) {
    this.name = data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim();
    this.firstName = data.firstName || null;
    this.lastName = data.lastName || null;
    this.email = data.email;
    this.phoneNumber = data.phoneNumber || null;
    this.role = data.role;
    this.profilePhoto = data.profilePhoto || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();

    // Student-specific fields
    if (data.role === USER_ROLES.STUDENT) {
      this.hostelId = data.hostelId;
      this.roomNumber = data.roomNumber;
    }

    // Admin-specific fields
    if (data.role === USER_ROLES.ADMIN) {
      this.hostelId = data.hostelId;
    }

    // Worker-specific fields
    if (data.role === USER_ROLES.WORKER) {
      this.skills = data.skills || [];
      this.hostels = data.hostels || [];
      this.availability = data.availability || {};
      this.isAvailable =
        data.isAvailable !== undefined ? data.isAvailable : true;
      this.noOfRatings = data.noOfRatings || 0; // Total number of ratings received
      this.rating = data.rating || 0; // Average rating (0-5)
    }
  }

  /**
   * Validate user data
   */
  static validate(data) {
    const errors = [];

    // Validate name or firstName/lastName
    if (!data.name && (!data.firstName || !data.lastName)) {
      errors.push("Name or firstName and lastName are required");
    }

    if (data.firstName && data.firstName.trim().length === 0) {
      errors.push("First name cannot be empty");
    }

    if (data.lastName && data.lastName.trim().length === 0) {
      errors.push("Last name cannot be empty");
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Valid email is required");
    }

    // Validate Pakistani phone number
    if (!data.phoneNumber || data.phoneNumber.trim().length === 0) {
      errors.push("Phone number is required");
    } else {
      const cleaned = data.phoneNumber.replace(/[\s\-]/g, '');
      const isValidPakistaniPhone = 
        /^\+92[0-9]{10}$/.test(cleaned) || // +92 format
        /^03[0-9]{9}$/.test(cleaned) ||   // 03 format (mobile)
        /^0[0-9]{10}$/.test(cleaned);     // 0 format (national)
      
      if (!isValidPakistaniPhone) {
        errors.push("Please enter a valid Pakistani phone number (e.g., +92XXXXXXXXXX, 03XXXXXXXXX, or 0XXXXXXXXX)");
      }
    }

    if (!Object.values(USER_ROLES).includes(data.role)) {
      errors.push(
        `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`
      );
    }

    if (data.role === USER_ROLES.STUDENT) {
      // hostelId will be set after lookup, so we don't validate it here
      if (!data.roomNumber) errors.push("Room number is required for students");
    }

    if (data.role === USER_ROLES.WORKER) {
      if (data.skills && Array.isArray(data.skills)) {
        const invalidSkills = data.skills.filter(
          (skill) => !Object.values(WORKER_SKILLS).includes(skill)
        );
        if (invalidSkills.length > 0) {
          errors.push(`Invalid skills: ${invalidSkills.join(", ")}`);
        }
      }
      // Validate rating if provided
      if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
        errors.push("Rating must be between 0 and 5");
      }
      if (data.noOfRatings !== undefined && data.noOfRatings < 0) {
        errors.push("Number of ratings cannot be negative");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert to Firestore document
   */
  toFirestore() {
    const doc = {
      name: this.name,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      role: this.role,
      profilePhoto: this.profilePhoto,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (this.role === USER_ROLES.STUDENT) {
      doc.hostelId = this.hostelId;
      doc.roomNumber = this.roomNumber;
    }

    if (this.role === USER_ROLES.ADMIN) {
      doc.hostelId = this.hostelId;
    }

    if (this.role === USER_ROLES.WORKER) {
      doc.skills = this.skills;
      doc.hostels = this.hostels;
      doc.availability = this.availability;
      doc.isAvailable = this.isAvailable;
      doc.noOfRatings = this.noOfRatings || 0;
      doc.rating = this.rating || 0;
    }

    return doc;
  }

  /**
   * Create from Firestore document
   */
  static fromFirestore(doc) {
    return new User(doc.data());
  }
}
