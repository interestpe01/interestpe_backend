const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  String(process.env.DB_PASS),
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // 👇 ADD THIS
    await sequelize.sync({ alter: true });
    console.log("✅ Models synced (columns updated)");

  } catch (err) {
    console.error("❌ Unable to connect to DB:", err.message);
  }
})();

module.exports = sequelize;
