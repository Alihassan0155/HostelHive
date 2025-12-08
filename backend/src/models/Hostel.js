export class Hostel {
  constructor(data) {
    this.name = data.name;
    this.address = data.address;
    this.totalRooms = data.totalRooms;
    this.adminId = data.adminId || null;
    this.workers = data.workers || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static validate(data) {
    const errors = [];
    if (!data.name || data.name.trim().length === 0) errors.push('Hostel name is required');
    if (!data.address || data.address.trim().length === 0) errors.push('Address is required');
    if (!data.totalRooms || typeof data.totalRooms !== 'number' || data.totalRooms < 1) errors.push('Total rooms must be a positive integer');
    if (data.workers && !Array.isArray(data.workers)) errors.push('Workers must be an array');
    return { isValid: errors.length === 0, errors };
  }

  toFirestore() {
    return {
      name: this.name,
      address: this.address,
      totalRooms: this.totalRooms,
      adminId: this.adminId,
      workers: this.workers,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    return new Hostel(doc.data());
  }
}

