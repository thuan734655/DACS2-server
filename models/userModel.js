import connectDB from "../config/ConnectDB.js";

class UserModel {
  static async getInfoByIdUser(idUser) {
    const sql = "SELECT  `fullName`,  `avatar` FROM `user` WHERE idUser = ?";
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
    
    const result = await connectDB.query(sql, [idUser, idUser, idUser, idUser, idUser, idUser]);
    return result;
  }
  static async sendFriendRequest(requesterId, receiverId) {
    // Check if friend request already exists
    const checkSql = `SELECT * FROM friend_requests 
      WHERE (requester_id = ? AND receiver_id = ?) 
      OR (requester_id = ? AND receiver_id = ?)`;
    const [existingRequest] = await connectDB.query(checkSql, [requesterId, receiverId, receiverId, requesterId]);

    if (existingRequest.length > 0) {
      throw new Error('Friend request already exists');
    }

    // Check if they are already friends
    const checkFriendsSql = `SELECT * FROM friends 
      WHERE (idUser = ? AND idFriend = ?) 
      OR (idUser = ? AND idFriend = ?)`;
    const [existingFriendship] = await connectDB.query(checkFriendsSql, [requesterId, receiverId, receiverId, requesterId]);

    if (existingFriendship.length > 0) {
      throw new Error('Users are already friends');
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
    console.log('Getting friend requests for userId:', userId);
    const [result] = await connectDB.query(sql, [userId]);
    console.log('Friend requests result:', result);
    return result;
  }

}

export default UserModel;
