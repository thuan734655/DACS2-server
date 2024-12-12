import db from '../config/firebaseConfig.js';
import NotificationModel from '../models/notificationModel.js';

const handleNotificationEvents = (socket, io) => {
  // Xử lý khi user kết nối
  socket.on('connect', () => {
    console.log('User connected:', socket.id);
  });

  // Xử lý join room notification
  socket.on('joinNotificationRoom', async ({ userId }) => {
    try {
      // Rời khỏi tất cả room cũ
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join vào room mới với userId
      const roomName = `user_${userId}`;
      socket.join(roomName);
      socket.userId = userId;

      console.log(`User ${userId} joined room: ${roomName}`);

      // Lấy notifications cũ của user
      const notifications = await NotificationModel.getNotifications(userId);
      console.log('Sending notifications to user:', notifications);
      
      // Gửi danh sách notifications cho user
      socket.emit('notificationsList', notifications);

      // Set up real-time listeners cho notifications mới
      const userNotificationsRef = db.ref('notifications')
        .orderByChild('recipientId')
        .equalTo(userId);

      userNotificationsRef.on('child_added', (snapshot) => {
        const newNotification = {
          id: snapshot.key,
          ...snapshot.val()
        };
        console.log('New notification:', newNotification);
        io.to(roomName).emit('newNotification', newNotification);
      });

      // Theo dõi thay đổi trạng thái đọc của notification
      userNotificationsRef.on('child_changed', (snapshot) => {
        const updatedNotification = {
          id: snapshot.key,
          ...snapshot.val()
        };
        io.to(roomName).emit('notificationUpdated', updatedNotification);
      });

      // Cleanup khi user disconnect
      socket.on('disconnect', () => {
        userNotificationsRef.off();
        console.log(`User ${userId} disconnected from room: ${roomName}`);
      });

    } catch (error) {
      console.error('Error in joinNotificationRoom:', error);
      socket.emit('error', { message: 'Failed to join notification room' });
    }
  });


  // Xử lý khi user đăng xuất hoặc rời room
  socket.on('leaveNotificationRoom', () => {
    const userId = socket.userId;
    if (userId) {
      const roomName = `user_${userId}`;
      socket.leave(roomName);
      console.log(`User ${userId} left room: ${roomName}`);

      // Remove Firebase listeners
      const userNotificationsRef = db.ref('notifications')
        .orderByChild('recipientId')
        .equalTo(userId);
      userNotificationsRef.off();
    }
  });

  return {
    createNotification: NotificationModel.createNotification,
    // Hàm helper để kiểm tra user có trong room không
    isUserInRoom: (userId) => {
      const roomName = `user_${userId}`;
      const room = io.sockets.adapter.rooms.get(roomName);
      return room !== undefined;
    },
    // Hàm helper để gửi notification đến room
    sendToUserRoom: (userId, notification) => {
      const roomName = `user_${userId}`;
      io.to(roomName).emit('newNotification', notification);
    }
  };
};

export default handleNotificationEvents;