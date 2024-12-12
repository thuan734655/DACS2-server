import connectDB from "../config/ConnectDB.js";
import { createAndEmitNotification } from "../utils/notificationForm.js";

class UserModel {
  static async getInfoByIdUser(idUser) {
    const sql =
      "SELECT  `fullName`,  `avatar`, `background` FROM `user` WHERE idUser = ?";
    const result = await connectDB.query(sql, [idUser]);
    return result;
  }
  static async getSuggestedFriends(idUser) {
    const sql = `SELECT u.*, COUNT(DISTINCT mf.idFriend) as mutual_friends_count 
      FROM user u 
      LEFT JOIN friends f1 ON u.idUser = f1.idFriend AND f1.idUser = ? 
      LEFT JOIN friends f2 ON u.idUser = f2.idUser AND f2.idFriend = ? 
      LEFT JOIN friend_requests fr ON (u.idUser = fr.requester_id AND fr.receiver_id = ?) 
        OR (u.idUser = fr.receiver_id AND fr.requester_id = ?) 
      LEFT JOIN friends mf ON mf.idUser = u.idUser 
      LEFT JOIN friends mf2 ON mf2.idFriend = mf.idFriend AND mf2.idUser = ? 
      WHERE u.idUser != ? 
        AND f1.idFriend IS NULL 
        AND f2.idFriend IS NULL 
        AND fr.id IS NULL 
      GROUP BY u.idUser 
      ORDER BY mutual_friends_count DESC, RAND() 
      LIMIT 10`;

    const result = await connectDB.query(sql, [
      idUser,
      idUser,
      idUser,
      idUser,
      idUser,
      idUser,
    ]);
    return result;
  }
  static async sendFriendRequest(requesterId, receiverId) {
    // Check if friend request already exists
    const checkSql = `SELECT * FROM friend_requests 
      WHERE (requester_id = ? AND receiver_id = ?) 
      OR (requester_id = ? AND receiver_id = ?)`;
    const [existingRequest] = await connectDB.query(checkSql, [
      requesterId,
      receiverId,
      receiverId,
      requesterId,
    ]);

    if (existingRequest.length > 0) {
      throw new Error("Friend request already exists");
    }

    // Check if they are already friends
    const checkFriendsSql = `SELECT * FROM friends 
      WHERE (idUser = ? AND idFriend = ?) 
      OR (idUser = ? AND idFriend = ?)`;
    const [existingFriendship] = await connectDB.query(checkFriendsSql, [
      requesterId,
      receiverId,
      receiverId,
      requesterId,
    ]);

    if (existingFriendship.length > 0) {
      throw new Error("Users are already friends");
    }

    // Insert new friend request
    const sql = `INSERT INTO friend_requests (requester_id, receiver_id, status, created_at) 
      VALUES (?, ?, 'pending', NOW())`;
    const result = await connectDB.query(sql, [requesterId, receiverId]);
    return result;
  }
  static async getFriendRequests(userId) {
    const sql = `
      SELECT 
        fr.*,
        u.fullName,
        u.avatar,
        u.idUser as requester_id
      FROM friend_requests fr
      JOIN user u ON fr.requester_id = u.idUser
      WHERE fr.receiver_id = ? AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    console.log("Getting friend requests for userId:", userId);
    const [result] = await connectDB.query(sql, [userId]);
    console.log("Friend requests result:", result);
    return result;
  }
  static async respondToFriendRequest(receiver_id, requester_id, accept, io) {
    const conn = await connectDB.getConnection();
    try {
      await conn.beginTransaction();
      console.log(
        `Xử lý phản hồi lời mời kết bạn - receiver_id: ${receiver_id}, requester_id: ${requester_id}, accept: ${accept}`
      );

      // Kiểm tra lời mời kết bạn
      const checkSql = `
        SELECT * FROM friend_requests 
        WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'
      `;
      const [checkResult] = await conn.query(checkSql, [
        requester_id,
        receiver_id,
      ]);
      console.log("Kết quả kiểm tra lời mời:", checkResult);

      if (!checkResult || checkResult.length === 0) {
        throw new Error("Không tìm thấy lời mời kết bạn phù hợp");
      }

      if (!accept) {
        // Từ chối lời mời kết bạn
        const deleteRequestSql =
          "DELETE FROM friend_requests WHERE requester_id = ? AND receiver_id = ?";
        await conn.query(deleteRequestSql, [requester_id, receiver_id]);

        // Tạo thông báo từ chối
        const [requester] = await UserModel.getInfoByIdUser(requester_id);
        const notificationData = {
          type: "FRIEND_REQUEST_DENY",
          senderId: +requester_id,
          senderName: requester[0]?.fullName || "Unknown",
          senderAvatar: requester[0]?.avatar || "",
          recipientId: +receiver_id,
          createdAt: new Date(),
        };
        createAndEmitNotification(io, notificationData);
        await conn.commit();
        return true;
      } else {
        // Chấp nhận lời mời kết bạn
        const updateSql = `
       UPDATE friend_requests 
       SET status = 'accepted' 
       WHERE requester_id = ? AND receiver_id = ? AND status = 'pending'
     `;
        await conn.query(updateSql, [requester_id, receiver_id]);

        // Kiểm tra xem đã là bạn bè chưa
        const checkFriendSql = `
       SELECT * FROM friends 
       WHERE (idUser = ? AND idFriend = ?) 
       OR (idUser = ? AND idFriend = ?)
     `;
        const [existingFriend] = await conn.query(checkFriendSql, [
          receiver_id,
          requester_id,
          requester_id,
          receiver_id,
        ]);

        if (!existingFriend || existingFriend.length === 0) {
          // Thêm bạn bè
          const addFriendsSql = `
         INSERT INTO friends (idUser, idFriend) 
         VALUES (?, ?), (?, ?)
       `;
          await conn.query(addFriendsSql, [
            receiver_id,
            requester_id,
            requester_id,
            receiver_id,
          ]);

          // Tạo thông báo chấp nhận
          const [requester] = await UserModel.getInfoByIdUser(requester_id);
          const notificationData = {
            type: "FRIEND_REQUEST_ACCEPTED",
            senderId: +requester_id,
            senderName: requester[0]?.fullName || "Unknown",
            senderAvatar: requester[0]?.avatar || "",
            recipientId: +receiver_id,
            createdAt: new Date(),
          };

          createAndEmitNotification(io, notificationData);
        } else {
          console.log("Đã là bạn bè từ trước");
        }

        await conn.commit();
        console.log("Đã hoàn tất xử lý lời mời kết bạn");
        return true;
      }
    } catch (error) {
      await conn.rollback();
      console.error("Lỗi trong quá trình xử lý lời mời kết bạn:", {
        error: error.message,
        receiver_id,
        requester_id,
        accept,
      });
      throw error;
    } finally {
      conn.release();
    }
  }

  static async getFriendCount(userId) {
    try {
      const sql = `
        SELECT COUNT(*) as friendCount 
        FROM friend_requests 
        WHERE (requester_id = ? OR receiver_id = ?)
        AND status = 'accepted'
      `;
      console.log("Đang đếm số bạn bè của user:", userId);
      const [result] = await connectDB.query(sql, [userId, userId]);
      console.log("Kết quả đếm bạn bè:", result);
      return result[0].friendCount;
    } catch (error) {
      console.error("Lỗi khi đếm số bạn bè:", error);
      throw error;
    }
  }
  static async searchUsersByName(fullName, currentUserId) {
    try {
      // Tìm kiếm user theo tên và loại trừ current user
      const searchSql = `
        SELECT 
          u.idUser,
          u.fullName,
          u.avatar,
          CASE 
            WHEN fr.status IS NOT NULL THEN fr.status
            ELSE 'none'
          END as friendStatus
        FROM user u
        LEFT JOIN friend_requests fr ON 
          (fr.requester_id = ? AND fr.receiver_id = u.idUser)
          OR (fr.receiver_id = ? AND fr.requester_id = u.idUser)
        WHERE u.idUser != ? 
        AND u.fullName LIKE ?
        ORDER BY 
          CASE 
            WHEN u.fullName LIKE ? THEN 0
            WHEN u.fullName LIKE ? THEN 1
            ELSE 2
          END,
          u.fullName
      `;

      const searchPattern = `%${fullName}%`;
      const startPattern = `${fullName}%`;
      console.log("Tìm kiếm user với pattern:", searchPattern);

      const [users] = await connectDB.query(searchSql, [
        currentUserId,
        currentUserId,
        currentUserId,
        searchPattern,
        startPattern,
        searchPattern,
      ]);

      console.log("Kết quả tìm kiếm:", users);
      return users;
    } catch (error) {
      console.error("Lỗi khi tìm kiếm user:", error);
      throw error;
    }
  }
  static async getFriendsList(userId) {
    const sql = `
      SELECT u.idUser, u.fullName, u.avatar, u.background
      FROM friends f
      JOIN user u ON f.idFriend = u.idUser
      WHERE f.idUser = ?
      ORDER BY u.fullName`;

    const [rows] = await connectDB.query(sql, [userId]);
    console.log("Danh sách bạn bè:", rows);
    return rows;
  }
  static async getUserInfo(userId) {
    try {
      const sql = `
        SELECT introduction, education, location 
        FROM user 
        WHERE idUser = ?`;
      const [result] = await connectDB.query(sql, [userId]);
      return (
        result[0] || {
          introduction: "",
          education: "",
          location: "",
        }
      );
    } catch (error) {
      console.error("Error getting user info:", error);
      throw error;
    }
  }

  static async updateUserInfo(userId, info) {
    const conn = await connectDB.getConnection();
    try {
      await conn.beginTransaction();

      const checkSql = "SELECT idUser FROM user WHERE idUser = ?";
      const [user] = await conn.query(checkSql, [userId]);

      if (!user || user.length === 0) {
        throw new Error("User not found");
      }

      // Check if user info exists
      const checkInfoSql = "SELECT idUser FROM user WHERE idUser = ?";
      const [existingInfo] = await conn.query(checkInfoSql, [userId]);

      let sql;
      let params;

      if (existingInfo && existingInfo.length > 0) {
        // Update existing info
        sql = `
          UPDATE user 
          SET introduction = ?, education = ?, location = ?
          WHERE idUser = ?`;
        params = [info.introduction, info.education, info.location, userId];
      } else {
        // Insert new info
        sql = `
          INSERT INTO user (idUser, introduction, education, location)
          VALUES (?, ?, ?, ?)`;
        params = [userId, info.introduction, info.education, info.location];
      }

      await conn.query(sql, params);
      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      console.error("Error updating user info:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async updateOnlineStatus(idUser, isOnline) {
    const sql = "UPDATE user SET isOnline = ? WHERE idUser = ?";
    return await connectDB.query(sql, [isOnline, idUser]);
  }

  static async getOnlineFriends(idUser) {
    const sql = `
      SELECT u.idUser, u.fullName, u.avatar 
      FROM user u
      INNER JOIN friends f ON (f.idFriend = u.idUser AND f.idUser = ?)
      WHERE u.isOnline = 1
    `;
    const [result] = await connectDB.query(sql, [idUser]);
    return result;
  }

  static async updateUserAvatar(userId, avatarPath, io) {
    io.emit("updateAvatar", { userId, avatarPath });
    const sql = "UPDATE user SET avatar = ? WHERE idUser = ?";
    const result = await connectDB.query(sql, [avatarPath, userId]);
    return result;
  }

  static async updateUserCover(userId, coverPath, io) {
    io.emit("updateCover", { userId, coverPath });
    const sql = "UPDATE user SET background = ? WHERE idUser = ?";
    const result = await connectDB.query(sql, [coverPath, userId]);
    console.log("result:", result);

    return result;
  }
}

export default UserModel;
