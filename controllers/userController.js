import UserModel from "../models/userModel.js";
import { handleResponse } from "../utils/createResponse.js";

class UserController {
  static async getInfoByIdUser(req, res) {
    const { idUser } = req.query;

    if (!idUser) {
      return handleResponse(res, 400, "fail", "idUser is required.");
    }

    try {
      const result = await UserModel.getInfoByIdUser(idUser);

      if (result.length === 0) {
        return handleResponse(res, 404, "fail", "User not found.");
      }

      return handleResponse(
        res,
        200,
        "success",
        "User info retrieved.",
        result[0]
      );
    } catch (error) {
      console.error("Database error:", error);
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }
}

export default UserController;
