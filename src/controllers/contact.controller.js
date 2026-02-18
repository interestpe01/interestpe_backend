const User = require("../models/user.model");
const FriendRequest = require("../models/friendRequest.model");
const Contact = require("../models/contact.model");

exports.sendRequest = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const fromUser = req.user.id;

    const toUser = await User.findOne({ where: { phoneNumber } });
    if (!toUser) return res.status(404).json({ msg: "User not found" });

    const request = await FriendRequest.create({
      fromUserId: fromUser,
      toUserId: toUser.userId,
    });
    return res.json({ msg: "Request sent", request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error sending request" });
  }
};

exports.respondRequest = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const request = await FriendRequest.findByPk(requestId);
    if (!request) return res.status(404).json({ msg: "Request not found" });
    console.log("======================", request);

    if (status === "accepted") {
      await Contact.create({
        userId: request.fromUserId,
        friendId: request.toUserId,
      });
      await Contact.create({
        userId: request.toUserId,
        friendId: request.fromUserId,
      });
    }

    request.status = status;
    console.log("======================222222222222222222");
    await request.save();
    console.log("======================333333333333333");
    return res.json({ msg: "Request updated", request });
  } catch (err) {
    console.log("------------------->>>>>>>>>", err);
    res.status(500).json({ msg: "Error responding to request" });
  }
};


exports.getFriends = async (req, res) => {
  try {
    const friends = await Contact.findAll({
      where: { userId: req.user.id },
    });
    return res.json({ friends });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching friends" });
  }
};

exports.addContact = async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    const userId = req.user.id;

    if (!name || !phoneNumber) {
      return res.status(400).json({ msg: "Name and phone number are required" });
    }

    const existingUser = await User.findOne({ where: { phoneNumber } });

    const contact = await Contact.create({
      userId,
      name,
      phoneNumber,
      friendId: existingUser ? existingUser.userId : null
    });

    return res.status(201).json({ msg: "Contact added successfully", contact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error adding contact" });
  }
};
