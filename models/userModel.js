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
}

export default UserModel;
