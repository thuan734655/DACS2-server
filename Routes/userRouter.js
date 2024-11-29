import express from "express";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.post("/info-user", UserController.getInfoByIdUser);
router.get('/users/:userId/suggested-friends', UserController.getSuggestedFriends);
router.post('/users/:idUser/send-friend-request', UserController.sendFriendRequest);
router.get('/users/:userId/friend-requests', UserController.getFriendRequests);

export default router;
