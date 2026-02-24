const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Expense = sequelize.define("Expense", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  fromUserId: { type: DataTypes.UUID, allowNull: false }, // who paid
  toUserId: { type: DataTypes.UUID, allowNull: true },   // who owes (nullable for non-registered contacts)
  contactId: { type: DataTypes.UUID, allowNull: true },  // specific contact record
  amount: { type: DataTypes.FLOAT, allowNull: false },
  message: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM("pending", "confirmed", "settled"), defaultValue: "pending" },
  interestRate: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  tenure: { type: DataTypes.INTEGER }, // e.g. 12 (months)
  date: { type: DataTypes.DATEONLY }, // e.g. "2026-01-28"
  transactionType: { type: DataTypes.ENUM("LEND", "ACCEPT"), defaultValue: "LEND" },
  repaymentType: { type: DataTypes.ENUM("INTEREST_ONLY", "INTEREST_PRINCIPAL"), allowNull: true } // Only for ACCEPT
});

module.exports = Expense;
