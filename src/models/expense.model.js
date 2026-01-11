const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Expense = sequelize.define("Expense", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fromUserId: { type: DataTypes.UUID, allowNull: false }, // who paid
  toUserId: { type: DataTypes.UUID, allowNull: false },   // who owes
  amount: { type: DataTypes.FLOAT, allowNull: false },
  message: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM("pending", "confirmed", "settled"), defaultValue: "pending" },
  interestRate: { type: DataTypes.FLOAT, defaultValue: 0.0 }
});

module.exports = Expense;
