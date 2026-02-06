const jwt = require("jsonwebtoken");

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m", // short life
      issuer: "interestpe",
    }
  );

  const refreshToken = jwt.sign(
    {
      id: user.userId,
    },
    process.env.REFRESH_SECRET,
    {
      expiresIn: "365d", // 1 year (feels infinite)
      issuer: "interestpe",
    }
  );

  return { accessToken, refreshToken };
};

module.exports = { generateTokens };
