const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ msg: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = authMiddleware;
