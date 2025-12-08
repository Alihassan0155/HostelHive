import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import { Hostel } from '../models/Hostel.js';

export class HostelService {
  static async getHostelById(hostelId) {
    const hostelDoc = await db.collection(COLLECTIONS.HOSTELS).doc(hostelId).get();
    if (!hostelDoc.exists) {
      throw new Error('Hostel not found');
    }
    return { id: hostelDoc.id, ...hostelDoc.data() };
  }

  static async getHostels() {
    const snapshot = await db.collection(COLLECTIONS.HOSTELS).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getHostelByName(hostelName) {
    const snapshot = await db
      .collection(COLLECTIONS.HOSTELS)
      .where('name', '==', hostelName)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  static async createHostel(hostelData) {
    const validation = Hostel.validate(hostelData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    const hostel = new Hostel(hostelData);
    const docRef = await db.collection(COLLECTIONS.HOSTELS).add(hostel.toFirestore());
    return { id: docRef.id, ...hostel.toFirestore() };
  }

  static async updateHostel(hostelId, updateData) {
    const hostelDoc = await db.collection(COLLECTIONS.HOSTELS).doc(hostelId);
    const existingHostel = await hostelDoc.get();
    if (!existingHostel.exists) {
      throw new Error('Hostel not found');
    }
    const updatedData = { ...existingHostel.data(), ...updateData, updatedAt: new Date().toISOString() };
    await hostelDoc.update(updatedData);
    return { id: hostelId, ...updatedData };
  }

  static async deleteHostel(hostelId) {
    const hostelDoc = await db.collection(COLLECTIONS.HOSTELS).doc(hostelId);
    const exists = await hostelDoc.get();
    if (!exists.exists) {
      throw new Error('Hostel not found');
    }
    await hostelDoc.delete();
    return { success: true };
  }

  static async addWorker(hostelId, workerId) {
    const hostel = await this.getHostelById(hostelId);
    if (!hostel.workers.includes(workerId)) {
      const updatedWorkers = [...hostel.workers, workerId];
      await this.updateHostel(hostelId, { workers: updatedWorkers });
      const { UserService } = await import('./userService.js');
      const worker = await UserService.getUserById(workerId);
      // Only add hostelId if not already in the array
      const currentHostels = worker.hostels || [];
      if (!currentHostels.includes(hostelId)) {
        const updatedHostels = [...currentHostels, hostelId];
        await UserService.updateUser(workerId, { hostels: updatedHostels });
      }
    }
    return this.getHostelById(hostelId);
  }

  static async removeWorker(hostelId, workerId) {
    const hostel = await this.getHostelById(hostelId);
    if (hostel.workers.includes(workerId)) {
      const updatedWorkers = hostel.workers.filter((id) => id !== workerId);
      await this.updateHostel(hostelId, { workers: updatedWorkers });
      const { UserService } = await import('./userService.js');
      const worker = await UserService.getUserById(workerId);
      const updatedHostels = (worker.hostels || []).filter((id) => id !== hostelId);
      await UserService.updateUser(workerId, { hostels: updatedHostels });
    }
    return this.getHostelById(hostelId);
  }
}

