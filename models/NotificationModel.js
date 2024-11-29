import db from '../config/firebaseConfig.js';

export class NotificationModel {
  static async createNotification(data) {
    try {
      const { type, recipientId, data: notificationData } = data;
      const ref = db.ref('notifications');
      const newNotificationRef = ref.push();
      
      const notification = {
        id: newNotificationRef.key,
        type,
        recipientId,
        data: notificationData,
        timestamp: Date.now(),
        read: false
      };

      await newNotificationRef.set(notification);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getNotifications(userId, limit = 20) {
    if (!userId) {
      console.error('No userId provided to getNotifications');
      return [];
    }

    try {
      const ref = db.ref('notifications');
      const snapshot = await ref
        .orderByChild('recipientId')
        .equalTo(userId)
        .limitToLast(limit)
        .once('value');
      
      const notifications = [];
      snapshot.forEach(childSnapshot => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      // Sắp xếp theo thời gian mới nhất
      return notifications.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  static async getNotificationById(notificationId) {
    try {
      const snapshot = await db.ref(`notifications/${notificationId}`).once('value');
      if (snapshot.exists()) {
        return {
          id: snapshot.key,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting notification:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId) {
    try {
      const ref = db.ref(`notifications/${notificationId}`);
      await ref.update({
        read: true,
        readAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const ref = db.ref('notifications');
      const snapshot = await ref
        .orderByChild('recipientId')
        .equalTo(userId)
        .once('value');
      
      const updates = {};
      snapshot.forEach(childSnapshot => {
        if (!childSnapshot.val().read) {
          updates[`${childSnapshot.key}/read`] = true;
          updates[`${childSnapshot.key}/readAt`] = Date.now();
        }
      });

      if (Object.keys(updates).length > 0) {
        await ref.update(updates);
      }
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const ref = db.ref('notifications');
      const snapshot = await ref
        .orderByChild('recipientId')
        .equalTo(userId)
        .once('value');
      
      let count = 0;
      snapshot.forEach(childSnapshot => {
        if (!childSnapshot.val().read) {
          count++;
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId) {
    try {
      await db.ref(`notifications/${notificationId}`).remove();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static async deleteAllNotifications(userId) {
    try {
      const ref = db.ref('notifications');
      const snapshot = await ref
        .orderByChild('recipientId')
        .equalTo(userId)
        .once('value');
      
      const updates = {};
      snapshot.forEach(childSnapshot => {
        updates[childSnapshot.key] = null;
      });

      if (Object.keys(updates).length > 0) {
        await ref.update(updates);
      }
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
}

export default NotificationModel;