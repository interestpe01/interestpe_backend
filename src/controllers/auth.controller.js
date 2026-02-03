const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const { generateTokens } = require("../../utils/jwt");
const jwt = require("jsonwebtoken");

let otpStore = {}; // { phoneNumber: "12345" }

exports.signup = async (req, res) => {
  try {
    const { phoneNumber, username, emailId, password, fullName, dateOfBirth, gender } = req.body;

    const existing = await User.findOne({ where: { phoneNumber } });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ phoneNumber, username, emailId, password: hashed, fullName, dateOfBirth, gender });

    otpStore[phoneNumber] = "12345";

    return res.json({ msg: "User created. Verify OTP to continue.", otp: "12345 (testing)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error in signup" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (otpStore[phoneNumber] !== otp) return res.status(400).json({ msg: "Invalid OTP" });

    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isVerified = true;
    await user.save();

    delete otpStore[phoneNumber];

    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    return res.json({ msg: "OTP verified", accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error verifying OTP" });
  }
};

exports.login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ where: { phoneNumber } });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (!user.isVerified) return res.status(403).json({ msg: "User not verified" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid password" });

    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    return res.json({ msg: "Login successful", accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error logging in" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ msg: "No refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user);
    res.cookie("accessToken", accessToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    return res.json({ msg: "Token refreshed", accessToken });
  } catch (err) {
    return res.status(401).json({ msg: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.json({ msg: "Logged out" });
};
