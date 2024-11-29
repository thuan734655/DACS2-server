import express from "express";
import UserController from "../controllers/userController.js";

const router = express.Router();

router.post("/info-user", UserController.getInfoByIdUser);
router.get('/users/:userId/suggested-friends', UserController.getSuggestedFriends);
export default router;
