const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.post("/send-request", authMiddleware, contactController.sendRequest);
router.post("/respond-request", authMiddleware, contactController.respondRequest);
router.post("/add-contact", authMiddleware, contactController.addContact);
router.get("/friends", authMiddleware, contactController.getFriends);

module.exports = router;
