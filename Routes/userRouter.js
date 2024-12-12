const express = require("express");
const UserController = require("../controllers/userController");
const { upload } = require("../middlewares/upload");

const router = express.Router();

router.post("/info-user", UserController.getInfoByIdUser);
router.get(
  "/users/:userId/suggested-friends",
  UserController.getSuggestedFriends
);
router.post(
  "/users/:idUser/send-friend-request",
  UserController.sendFriendRequest
);
router.get("/users/:userId/friend-requests", UserController.getFriendRequests);
router.post(
  "/users/:userId/respond-friend-request",
  UserController.respondToFriendRequest
);
router.get("/users/:userId/friends/count", UserController.getFriendCount);
router.get("/users/search-by-name", UserController.searchUsersByName);
router.get("/users/:userId/friends", UserController.getFriendsList);
router.get("/users/:userId/online-friends", UserController.getOnlineFriends);
router.get("/users/:userId/info", UserController.getUserInfo);
router.put("/users/:userId/info", UserController.updateUserInfo);
router.post(
  "/users/:userId/update-avatar",
  upload.single("avatar"),
  UserController.updateAvatar
);
router.post(
  "/users/:userId/update-cover",
  upload.single("cover"),
  UserController.updateCover
);

module.exports = router;
