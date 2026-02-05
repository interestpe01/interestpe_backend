const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../../middleware/auth.middleware");

// Get user by mobile number
router.post("/getUser", authMiddleware, userController.getUser);

module.exports = router;
