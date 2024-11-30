import db from '../config/firebaseConfig.js';
import UserModel from './userModel.js';

export class NotificationModel {
  static async createNotification({ type, data, recipientId }) {
    try {
      // Get sender info from MySQL using UserModel
      const [senderInfo] = await UserModel.getInfoByIdUser(data.userId);
      if (!senderInfo || !senderInfo[0]) {
        throw new Error('Sender not found');
      }

      let notificationData = {
        type,
        senderId: data.userId,
        senderName: data.userName || senderInfo[0].fullName,
        senderAvatar: data.userAvatar || senderInfo[0].avatar,
        recipientId,
        timestamp: Date.now(),
        read: false,
        data
      };

      // Save to Firebase
      const newNotificationRef = db.ref('notifications').push();
      await newNotificationRef.set(notificationData);

      return {
        id: newNotificationRef.key,
        ...notificationData
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static getNotificationMessage(notification) {
    switch (notification.type) {
      case 'post_like':
        return `${notification.senderName} đã thích bài viết của bạn`;
      case 'post_comment':
        return `${notification.senderName} đã bình luận về bài viết của bạn`;
      case 'friend_request':
        return `${notification.senderName} đã gửi lời mời kết bạn`;
      case 'friend_accept':
        return `${notification.senderName} đã chấp nhận lời mời kết bạn của bạn`;
      default:
        return notification.content;
    }
  }

  static getNotificationLink(notification) {
    switch (notification.type) {
      case 'post_like':
      case 'post_comment':
        return `/post/${notification.relatedId}`;
      case 'friend_request':
      case 'friend_accept':
        return `/profile/${notification.senderId}`;
      default:
        return '#';
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
        .orderByChild('recipientId') // Sắp xếp theo recipientId
        .equalTo(userId)            // Lọc theo userId
        .limitToLast(limit)         // Giới hạn số lượng
        .once('value');             // Lấy dữ liệu một lần
  
      // Kiểm tra dữ liệu trống
      if (!snapshot.exists()) {
        console.log('No notifications found for userId:', userId);
        return [];
      }
  
      const notifications = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,   // ID của notification
          ...childSnapshot.val()   // Giá trị của notification
        });
      });
      // Sắp xếp thông báo theo thời gian mới nhất
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