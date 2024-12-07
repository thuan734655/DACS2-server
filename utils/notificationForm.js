// utils/notificationUtils.js
import NotificationModel from "../models/notificationModel.js";

/**
 * Create and emit a notification
 * @param {Object} io - Socket.IO server instance
 * @param {Object} notificationData - Notification data
 * @param {string} data.type - Type of the notification
 * @param {string} data.postId - ID of the related post
 * @param {string} data.recipientId - User ID of the recipient
 * @param {string} data.senderId - User ID of the sender
 * @param {string} [data.senderAvatar] - Avatar of the sender
 * @param {string} [data.senderName] - Name of the sender
 * @param {string} [data.content] - Additional content for the notification
 * @returns {Promise<void>}
 */
export async function createAndEmitNotification(io, notificationData) {
  try {
    const content = {
      type: notificationData.type,
      postId: notificationData.postId,
      recipientId: notificationData.recipientId,
      parentReplyID: notificationData.parentReplyID || "",
      senderId: notificationData.senderId,
      commentId: notificationData.commentId || "",
      senderAvatar: notificationData.senderAvatar || "",
      senderName: notificationData.senderName || "",
      content: notificationData.content || "",
      createdAt: Date.now(),
      read: false,
    };

    // Save the notification to the database
    const resultCreateNotification =
      await NotificationModel.createNewNotification(content);

    // Emit the notification to the recipient
    io.emit("notification", {
      originPostIdUser: notificationData.recipientId,
      type: notificationData.type,
      notificationData: resultCreateNotification,
    });

    console.log("Notification created and emitted:", content);
  } catch (error) {
    console.error("Error creating or emitting notification:", error);
  }
}
