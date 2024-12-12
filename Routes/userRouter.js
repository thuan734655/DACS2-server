import express from "express";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.post("/info-user", UserController.getInfoByIdUser);
router.get('/users/:userId/suggested-friends', UserController.getSuggestedFriends);
router.post('/users/:idUser/send-friend-request', UserController.sendFriendRequest);
router.get('/users/:userId/friend-requests', UserController.getFriendRequests);
router.post('/users/:userId/respond-friend-request', UserController.respondToFriendRequest);
router.get('/users/:userId/friends/count', UserController.getFriendCount);
router.get('/users/search-by-name', UserController.searchUsersByName);
router.get('/users/:userId/friends', UserController.getFriendsList);
export default router;  
