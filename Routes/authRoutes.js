const express = require("express");
const AuthController = require("../controllers/authController");

const router = express.Router();

router.post("/v1/auth/login", AuthController.login);
router.post("/v1/auth/register", AuthController.register);

module.exports = router;
