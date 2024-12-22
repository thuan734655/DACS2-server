import UserModel from "../models/userModel.js";
import { handleResponse } from "../utils/createResponse.js";
import { createAndEmitNotification } from "../utils/notificationForm.js";

class UserController {
  static async getInfoByIdUser(req, res) {
    const { idUser } = req.body;

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
  static async getSuggestedFriends(req, res) {
    const userId = req.params.userId;
    console.log("Controller - Received userId:", userId);
    if (!userId) {
      return handleResponse(res, 400, "fail", "userId is required.");
    }

    try {
      const suggestions = await UserModel.getSuggestedFriends(userId);
      console.log("Controller - Suggestions count:", suggestions.length);
      console.log("Controller - First suggestion:", suggestions[0]);
      return handleResponse(
        res,
        200,
        "success",
        "Successfully retrieved friend suggestions",
        suggestions
      );
    } catch (error) {
      console.error("Error getting friend suggestions:", error);
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }
  static async sendFriendRequest(req, res) {
    console.log("Request body:", req.body); // Log toàn bộ request body
    const receiverId = req.params.idUser; // ID người nhận từ params
    const requesterId = req.body.requesterId; // ID người gửi từ body
    console.log(
      "Controller - Received friend request from:",
      requesterId,
      "to:",
      receiverId
    );

    if (!requesterId || !receiverId) {
      return handleResponse(
        res,
        400,
        "fail",
        "Both requester ID and receiver ID are required."
      );
    }

    if (requesterId === receiverId) {
      return handleResponse(
        res,
        400,
        "fail",
        "Cannot send friend request to yourself."
      );
    }

    try {
      await UserModel.sendFriendRequest(requesterId, receiverId);

      // Get requester info for notification
      const [requester] = await UserModel.getInfoByIdUser(requesterId);
      // Create notification data
      const notificationData = {
        type: "FRIEND_REQUEST",
        senderId: +requesterId,
        senderName: requester[0].fullName,
        senderAvatar: requester[0].avatar,
        recipientId: +receiverId,
        createdAt: new Date(),
      };

      const io = req.app.get("io");
      createAndEmitNotification(io, notificationData);
      return handleResponse(
        res,
        200,
        "success",
        "Friend request sent successfully."
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
      if (
        error.message === "Friend request already exists" ||
        error.message === "Users are already friends"
      ) {
        return handleResponse(res, 400, "fail", error.message);
      }
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }
  static async getFriendRequests(req, res) {
    const userId = req.params.userId;
    console.log("Getting friend requests for user:", userId);

    if (!userId) {
      return handleResponse(res, 400, "fail", "userId là bắt buộc");
    }

    try {
      const friendRequests = await UserModel.getFriendRequests(userId);
      console.log("Found friend requests:", friendRequests);

      return handleResponse(
        res,
        200,
        "success",
        "Lấy danh sách lời mời kết bạn thành công",
        friendRequests
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lời mời kết bạn:", error);
      return handleResponse(res, 500, "error", "Internal server error");
    }
  }
  static async respondToFriendRequest(req, res) {
    const receiver_id = req.params.userId; // ID người nhận lời mời (người đang đăng nhập)
    const { requester_id, accept } = req.body; // ID người gửi lời mời và quyết định chấp nhận/từ chối

    console.log("Xử lý phản hồi lời mời kết bạn:", {
      receiver_id,
      requester_id,
      accept,
      body: req.body,
    });

    if (!receiver_id || !requester_id) {
      return handleResponse(
        res,
        400,
        "fail",
        "Thiếu thông tin người gửi hoặc người nhận lời mời"
      );
    }

    try {
      const io = req.app.get("io"); // Lấy IO server từ app
      await UserModel.respondToFriendRequest(
        receiver_id,
        requester_id,
        accept,
        io
      );
      return handleResponse(
        res,
        200,
        "success",
        accept ? "Đã chấp nhận lời mời kết bạn" : "Đã từ chối lời mời kết bạn"
      );
    } catch (error) {
      console.error("Lỗi khi phản hồi lời mời kết bạn:", {
        error: error.message,
        receiver_id,
        requester_id,
        accept,
      });
      return handleResponse(res, 500, "error", `Lỗi máy chủ: ${error.message}`);
    }
  }
  static async getFriendCount(req, res) {
    const userId = req.params.userId;
    console.log("Lấy số lượng bạn bè cho user:", userId);

    if (!userId) {
      return handleResponse(res, 400, "fail", "userId là bắt buộc");
    }

    try {
      const count = await UserModel.getFriendCount(userId);
      return handleResponse(
        res,
        200,
        "success",
        "Lấy số lượng bạn bè thành công",
        { count }
      );
    } catch (error) {
      console.error("Lỗi khi lấy số lượng bạn bè:", error);
      return handleResponse(res, 500, "error", "Lỗi máy chủ");
    }
  }
  static async searchUsersByName(req, res) {
    const { fullName, currentUserId } = req.query;
    console.log("Tìm kiếm user với tên:", fullName);

    if (!fullName || !currentUserId) {
      return handleResponse(res, 400, "fail", "Thiếu thông tin tìm kiếm");
    }

    try {
      const users = await UserModel.searchUsersByName(fullName, currentUserId);
      return handleResponse(res, 200, "success", "Tìm kiếm thành công", users);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm user:", error);
      return handleResponse(res, 500, "error", "Lỗi máy chủ");
    }
  }
  static async getFriendsList(req, res) {
    const userId = req.params.userId;

    if (!userId) {
      return handleResponse(res, 400, "fail", "userId là bắt buộc");
    }

    try {
      const friends = await UserModel.getFriendsList(userId);
      return handleResponse(
        res,
        200,
        "success",
        "Lấy danh sách bạn bè thành công",
        friends
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
      return handleResponse(res, 500, "error", "Lỗi máy chủ");
    }
  }
  static async getUserInfo(req, res) {
    const userId = req.params.userId;

    if (!userId) {
      return handleResponse(res, 400, "fail", "userId is required.");
    }

    try {
      const userInfo = await UserModel.getUserInfo(userId);

      if (!userInfo) {
        return handleResponse(res, 404, "fail", "User not found.");
      }

      return handleResponse(
        res,
        200,
        "success",
        "User info retrieved successfully.",
        userInfo
      );
    } catch (error) {
      console.error("Error getting user info:", error);
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }

  static async updateUserInfo(req, res) {
    const userId = req.params.userId;
    const info = req.body;

    if (!userId) {
      return handleResponse(res, 400, "fail", "userId is required.");
    }

    if (!info || Object.keys(info).length === 0) {
      return handleResponse(
        res,
        400,
        "fail",
        "Update information is required."
      );
    }

    try {
      const updated = await UserModel.updateUserInfo(userId, info);

      if (!updated) {
        return handleResponse(
          res,
          404,
          "fail",
          "User not found or update failed."
        );
      }

      return handleResponse(
        res,
        200,
        "success",
        "User info updated successfully."
      );
    } catch (error) {
      console.error("Error updating user info:", error);
      return handleResponse(res, 500, "error", "Internal server error.");
    }
  }

  static async updateOnlineStatus(req, res) {
    const { idUser } = req.params;
    const { isOnline } = req.body;

    if (!idUser) {
      return handleResponse(res, 400, "fail", "idUser is required.");
    }

    try {
      await UserModel.updateOnlineStatus(idUser, isOnline);
      return handleResponse(
        res,
        200,
        "success",
        "Online status updated successfully"
      );
    } catch (error) {
      console.error("Error updating online status:", error);
      return handleResponse(res, 500, "error", "Internal server error");
    }
  }

  static async getOnlineFriends(req, res) {
    const { idUser } = req.params;

    if (!idUser) {
      return handleResponse(res, 400, "fail", "idUser is required.");
    }

    try {
      const onlineFriends = await UserModel.getOnlineFriends(idUser);
      return handleResponse(
        res,
        200,
        "success",
        "Online friends retrieved successfully",
        onlineFriends
      );
    } catch (error) {
      console.error("Error getting online friends:", error);
      return handleResponse(res, 500, "error", "Internal server error");
    }
  }
  async getOnlineFriends(req, res) {
    try {
      const userId = req.params.userId; // Lấy ID user từ params
      console.log(userId);

      const onlineFriends = await UserModel.getOnlineFriends(userId); // Gọi hàm static từ Model
      return handleResponse(
        res,
        200,
        "Lấy danh sách bạn bè online thành công",
        onlineFriends
      );
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè online:", error);
      return handleResponse(res, 500, "Lỗi server", null);
    }
  }

  static async updateAvatar(req, res) {
    const io = req.app.get("io");
    try {
      if (!req.file) {
        return handleResponse(res, 400, "fail", "No file uploaded");
      }

      const userId = req.params.userId;
      const avatarPath = `/images/${req.file.filename}`;

      await UserModel.updateUserAvatar(userId, avatarPath, io);

      return handleResponse(
        res,
        200,
        "success",
        "Avatar updated successfully",
        { avatarPath }
      );
    } catch (error) {
      console.error("Error updating avatar:", error);
      return handleResponse(res, 500, "error", "Internal server error");
    }
  }

  static async updateCover(req, res) {
    const io = req.app.get("io");
    try {
      if (!req.file) {
        return handleResponse(res, 400, "fail", "No file uploaded");
      }

      const userId = req.params.userId;
      const coverPath = `/images/${req.file.filename}`;

      await UserModel.updateUserCover(userId, coverPath, io);

      return handleResponse(
        res,
        200,
        "success",
        "Cover image updated successfully",
        { coverPath }
      );
    } catch (error) {
      console.error("Error updating cover image:", error);
      return handleResponse(res, 500, "error", "Internal server error");
    }
  }
}

export default UserController;
