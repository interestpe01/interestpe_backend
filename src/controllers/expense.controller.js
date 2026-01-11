const Expense = require("../models/expense.model");
const { Op } = require("sequelize");

exports.addExpense = async (req, res) => {
  try {
    const { friendId, amount, message, interestRate } = req.body;
    const fromUserId = req.user.userId;

    const expense = await Expense.create({
      fromUserId,
      toUserId: friendId,
      amount,
      message,
      interestRate
    });

    return res.json({ msg: "Expense added, pending confirmation", expense });
  } catch (err) {
    res.status(500).json({ msg: "Error adding expense" });
  }
};

exports.confirmExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByPk(id);
    if (!expense) return res.status(404).json({ msg: "Expense not found" });

    expense.status = "confirmed";
    await expense.save();

    return res.json({ msg: "Expense confirmed", expense });
  } catch (err) {
    res.status(500).json({ msg: "Error confirming expense" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    const history = await Expense.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId }
        ]
      }
    });

    return res.json({ history });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching history" });
  }
};

exports.settleExpenses = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    const expenses = await Expense.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId, toUserId: friendId, status: "confirmed" },
          { fromUserId: friendId, toUserId: userId, status: "confirmed" }
        ]
      }
    });

    for (let exp of expenses) {
      exp.status = "settled";
      await exp.save();
    }

    return res.json({ msg: "All expenses settled" });
  } catch (err) {
    res.status(500).json({ msg: "Error settling expenses" });
  }
};
