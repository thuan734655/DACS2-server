import connectDB from "../config/ConnectDB.js";

class UserModel {
  static async getInfoByIdUser(idUser) {
    const sql = "SELECT  `fullName`,  `avatar` FROM `user` WHERE idUser = ?";
    const result = await connectDB.query(sql, [idUser]);
    return result;
  }
}

export default UserModel;
