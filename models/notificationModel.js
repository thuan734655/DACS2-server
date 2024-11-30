import db from "../config/firebaseConfig.js";
import UserModel from "./userModel.js";

export class NotificationModel {
  static types = {
    LIKE: "like",
    COMMENT: "comment",
    FRIEND_REQUEST: "friend_request",
    FRIEND_ACCEPT: "friend_accept",
    SHARE: "share",
    MENTION: "mention",
    GROUP_INVITE: "group_invite",
    GROUP_ACCEPT: "group_accept",
    POST_TAG: "post_tag",
  };

  static async createNotification({
    type,
    data,
    senderId,
    recipientId,
    relatedId,
  }) {
    try {
      // Get sender info from MySQL using UserModel
      const [senderInfo] = await UserModel.getInfoByIdUser(senderId);
      if (!senderInfo || !senderInfo[0]) {
        throw new Error("Sender not found");
      }

      let notificationData = {
        type,
        senderId,
        recipientId,
        timestamp: Date.now(),
        read: false,
        relatedId,
        data: {
          ...data,
          senderName: data.userName || senderInfo[0].fullName,
          senderAvatar: data.userAvatar || senderInfo[0].avatar || "",
          // Add preview content based on type
          preview: data.content
            ? type === "comment"
              ? data.content.substring(0, 100) +
                (data.content.length > 100 ? "..." : "")
              : data.content
            : "",
          postTitle: data.postTitle || "Bài viết",
          postImage: data.postImage || null,
          // Add interaction details
          interactionType: type === "like" ? data.emoji || "👍" : null,
        },
      };

      // Save to Firebase
      const newNotificationRef = db.ref("notifications").push();
      await newNotificationRef.set(notificationData);

      return {
        id: newNotificationRef.key,
        ...notificationData,
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Hàm tạo thông báo chia sẻ bài viết và lưu vào Firebase
  static createShareNotification = async (
    senderId,
    postId,
    recipientId,
    notificationData
  ) => {
    try {
      // Lấy thông tin bài viết từ Firebase
      const postSnapshot = await db.ref("posts").child(postId).once("value");
      if (!postSnapshot.exists()) {
        throw new Error("Post not found");
      }

      const postData = postSnapshot.val();

      const [result] = await UserModel.getInfoByIdUser(senderId);
      const userInfo = { ...result };
      console.log(userInfo);
      // Tạo đối tượng thông báo
      const notification = {
        type: "share",
        senderId: senderId,
        recipientId: recipientId,
        timestamp: Date.now(),
        read: false,
        relatedId: postId,
        data: {
          postTitle: notificationData.shareText || "",
          postImage: postData.mediaUrls || " ",
          senderName: userInfo[0].senderName || "",
          senderAvatar: userInfo[0].senderAvatar || "",
        },
      };

      // Lưu thông báo vào Firebase
      const newNotificationRef = db.ref("notifications").push();
      await newNotificationRef.set(notification);

      console.log(
        "[DEBUG] Thông báo chia sẻ bài viết đã được lưu vào Firebase:",
        notification
      );

      return {
        id: newNotificationRef.key,
        ...notification,
      };
    } catch (error) {
      console.error("Error creating share notification:", error);
      throw error;
    }
  };

  static getNotificationMessage(notification) {
    switch (notification.type) {
      case this.types.LIKE:
        return {
          title: `${notification.data.senderName} đã thích bài viết của bạn`,
          description: notification.data.postTitle || "Bài viết",
          action: "thích",
        };
      case this.types.COMMENT:
        return {
          title: `${notification.data.senderName} đã bình luận về bài viết của bạn`,
          description: notification.data.preview || "Bài viết",
          action: "bình luận",
        };
      case this.types.FRIEND_REQUEST:
        return {
          title: `${notification.data.senderName} muốn kết bạn với bạn`,
          description: "Chấp nhận để trở thành bạn bè và chia sẻ với nhau",
          action: "gửi lời mời kết bạn",
        };
      case this.types.FRIEND_ACCEPT:
        return {
          title: `${notification.data.senderName} đã chấp nhận lời mời kết bạn`,
          description:
            "Giờ đây các bạn đã là bạn bè, hãy chia sẻ những khoảnh khắc với nhau",
          action: "chấp nhận kết bạn",
        };
      case this.types.SHARE:
        return {
          title: `${notification.data.senderName} đã chia sẻ bài viết của bạn`,
          description: notification.data.postTitle || "Bài viết",
          action: "chia sẻ",
        };
      case this.types.MENTION:
        return {
          title: `${notification.data.senderName} đã nhắc đến bạn trong một bài viết`,
          description: notification.data.preview || "Bài viết",
          action: "nhắc đến",
        };
      case this.types.GROUP_INVITE:
        return {
          title: `${notification.data.senderName} đã mời bạn tham gia nhóm`,
          description: notification.data.groupName || "Nhóm mới",
          action: "mời nhóm",
        };
      case this.types.GROUP_ACCEPT:
        return {
          title: `${notification.data.senderName} đã chấp nhận lời mời tham gia nhóm`,
          description: notification.data.groupName || "Nhóm",
          action: "chấp nhận nhóm",
        };
      case this.types.POST_TAG:
        return {
          title: `${notification.data.senderName} đã gắn thẻ bạn trong một bài viết`,
          description: notification.data.postTitle || "Bài viết",
          action: "gắn thẻ",
        };
      default:
        return {
          title: "",
          description: "",
          action: "",
        };
    }
  }

  static getNotificationLink(notification) {
    switch (notification.type) {
      case this.types.LIKE:
      case this.types.COMMENT:
        return `/post/${notification.relatedId}`;
      case this.types.FRIEND_REQUEST:
      case this.types.FRIEND_ACCEPT:
        return `/profile/${notification.senderId}`;
      case this.types.SHARE:
        return `/post/${notification.relatedId}`;
      case this.types.MENTION:
        return `/post/${notification.relatedId}`;
      case this.types.GROUP_INVITE:
      case this.types.GROUP_ACCEPT:
        return `/group/${notification.data.groupId}`;
      case this.types.POST_TAG:
        return `/post/${notification.relatedId}`;
      default:
        return "#";
    }
  }

  static async getNotifications(userId, limit = 20) {
    if (!userId) {
      console.error("No userId provided to getNotifications");
      return [];
    }

    try {
      const ref = db.ref("notifications");
      const snapshot = await ref
        .orderByChild("recipientId") // Sắp xếp theo recipientId
        .equalTo(userId) // Lọc theo userId
        .limitToLast(limit) // Giới hạn số lượng
        .once("value"); // Lấy dữ liệu một lần

      // Kiểm tra dữ liệu trống
      if (!snapshot.exists()) {
        console.log("No notifications found for userId:", userId);
        return [];
      }

      const notifications = [];
      snapshot.forEach((childSnapshot) => {
        notifications.push({
          id: childSnapshot.key, // ID của notification
          ...childSnapshot.val(), // Giá trị của notification
        });
      });

      const result = notifications.sort((a, b) => b.timestamp - a.timestamp);
      console.log(result);
      return result;
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  static async getNotificationById(notificationId) {
    try {
      const snapshot = await db
        .ref(`notifications/${notificationId}`)
        .once("value");
      if (snapshot.exists()) {
        return {
          id: snapshot.key,
          ...snapshot.val(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting notification:", error);
      throw error;
    }
  }

  static async markAsRead(notificationId) {
    try {
      const ref = db.ref(`notifications/${notificationId}`);
      await ref.update({
        read: true,
        readAt: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const ref = db.ref("notifications");
      const snapshot = await ref
        .orderByChild("recipientId")
        .equalTo(userId)
        .once("value");

      const updates = {};
      snapshot.forEach((childSnapshot) => {
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
      console.error("Error marking all as read:", error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const ref = db.ref("notifications");
      const snapshot = await ref
        .orderByChild("recipientId")
        .equalTo(userId)
        .once("value");

      let count = 0;
      snapshot.forEach((childSnapshot) => {
        if (!childSnapshot.val().read) {
          count++;
        }
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  static async deleteNotification(notificationId) {
    try {
      await db.ref(`notifications/${notificationId}`).remove();
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  static async deleteAllNotifications(userId) {
    try {
      const ref = db.ref("notifications");
      const snapshot = await ref
        .orderByChild("recipientId")
        .equalTo(userId)
        .once("value");

      const updates = {};
      snapshot.forEach((childSnapshot) => {
        updates[childSnapshot.key] = null;
      });

      if (Object.keys(updates).length > 0) {
        await ref.update(updates);
      }
      return true;
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      throw error;
    }
  }
}

export default NotificationModel;
