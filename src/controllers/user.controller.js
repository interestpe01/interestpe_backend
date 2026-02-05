const User = require("../models/user.model");

exports.getUser = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({
      where: { phoneNumber },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by mobile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
