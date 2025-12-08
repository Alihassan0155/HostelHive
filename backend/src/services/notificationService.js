import { db } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import { Notification } from '../models/Notification.js';

export class NotificationService {
  static async getNotificationById(notificationId) {
    const notificationDoc = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId).get();
    if (!notificationDoc.exists) {
      throw new Error('Notification not found');
    }
    return { id: notificationDoc.id, ...notificationDoc.data() };
  }

  static async getUserNotifications(userId, filters = {}) {
    let query = db.collection(COLLECTIONS.NOTIFICATIONS).where('userId', '==', userId);
    if (filters.read !== undefined) query = query.where('read', '==', filters.read);
    query = query.orderBy('createdAt', 'desc');
    if (filters.limit) query = query.limit(filters.limit);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async createNotification(notificationData) {
    const notification = new Notification(notificationData);
    const docRef = await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification.toFirestore());
    return { id: docRef.id, ...notification.toFirestore() };
  }

  static async markAsRead(notificationId) {
    const notificationDoc = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId);
    const exists = await notificationDoc.get();
    if (!exists.exists) {
      throw new Error('Notification not found');
    }
    await notificationDoc.update({ read: true });
    return { id: notificationId, ...exists.data(), read: true };
  }

  static async markAllAsRead(userId) {
    const notifications = await this.getUserNotifications(userId, { read: false });
    const batch = db.batch();
    notifications.forEach((notification) => {
      const ref = db.collection(COLLECTIONS.NOTIFICATIONS).doc(notification.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
    return { success: true, count: notifications.length };
  }

  static async deleteNotification(notificationId) {
    const notificationDoc = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notificationId);
    const exists = await notificationDoc.get();
    if (!exists.exists) {
      throw new Error('Notification not found');
    }
    await notificationDoc.delete();
    return { success: true };
  }

  static async getUnreadCount(userId) {
    const snapshot = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();
    return snapshot.size;
  }
}

