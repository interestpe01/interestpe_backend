const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

// 🔥 Force dotenv to load from same folder as app.js
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("Loaded .env from:", path.join(__dirname, ".env"));
console.log("DB_PASS:", typeof process.env.DB_PASS, process.env.DB_PASS);
console.log("DB_HOST:", process.env.DB_HOST);

const sequelize = require("./src/config/db");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/contacts", require("./src/routes/contact.routes"));
app.use("/api/expenses", require("./src/routes/expense.routes"));
app.use("/api/users", require("./src/routes/user.routes"));

app.get("/ping", (req, res) => {
  res.json("pong");
});

sequelize.sync({ alter: true }).then(() => {
  console.log("DB Synced");
  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
});
