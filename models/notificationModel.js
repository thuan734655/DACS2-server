import db from "../config/firebaseConfig.js";

export class NotificationModel {
  // Hàm tạo thông báo chia sẻ bài viết và lưu vào Firebase
  static createNewNotification = async (notificationData) => {
    try {
      // Lưu thông báo vào Firebase
      const newNotificationRef = db.ref("notifications").push();
      await newNotificationRef.set(notificationData);

      return {
        id: newNotificationRef.key,
        ...notificationData,
      };
    } catch (error) {
      console.error("Error creating share notification:", error);
      throw error;
    }
  };
  static fetchUnreadNotifications = async () => {
    const db = getDatabase();
    const notificationsRef = ref(db, "notifications");

    // Query for notifications where `read` equals `false`
    const unreadQuery = query(
      notificationsRef,
      orderByChild("read"),
      equalTo(false)
    );

    try {
      const snapshot = await get(unreadQuery);
      if (snapshot.exists()) {
        const unreadNotifications = snapshot.val();
        console.log("Unread Notifications:", unreadNotifications);
        return unreadNotifications;
      } else {
        console.log("No unread notifications found.");
        return {};
      }
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      throw error;
    }
  };
  static async getNotifications(userId, limit = 20) {
    if (!userId) {
      console.error("No userId provided to getNotifications");
      return [];
    }

    try {
      const ref = db.ref("notifications");

      // Lọc theo recipientId và giới hạn số lượng
      const snapshot = await ref
        .orderByChild("recipientId")
        .equalTo(221)
        .limitToLast(limit)
        .once("value");

      if (!snapshot.exists()) {
        console.log("No notifications found for userId:", userId);
        return [];
      }

      // Chuyển đổi snapshot thành mảng
      const notifications = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });

      // Firebase đã trả kết quả theo thứ tự sắp xếp (ascending),
      // nên cần đảo ngược để có descending order theo `createdAt`
      const result = notifications.sort((a, b) => b.createdAt - a.createdAt);
      console.log(result);
      return result;
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }
}

export default NotificationModel;
