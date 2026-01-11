const jwt = require("jsonwebtoken");

const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId: user.userId }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

module.exports = { generateTokens };
