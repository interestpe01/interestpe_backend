const express = require("express");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const sequelize = require("./src/config/db");

const app = express();
app.use(express.json());
app.use(cookieParser());

console.log("DB_PASS:", typeof process.env.DB_PASS, process.env.DB_PASS);


app.use("/api/auth", require("./src/routes/auth.routes"));
app.use("/api/contacts", require("./src/routes/contact.routes"));
app.use("/api/expenses", require("./src/routes/expense.routes"));

app.get("/ping", (req, res) => {
  res.json("pong");
});


sequelize.sync({ alter: true }).then(() => {
  console.log("DB Synced");
  app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
});
