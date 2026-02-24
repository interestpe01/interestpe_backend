const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expense.controller");
const authMiddleware = require("../../middleware/auth.middleware");

router.post("/add", authMiddleware, expenseController.addExpense);
router.post("/confirm/:id", authMiddleware, expenseController.confirmExpense);
router.post("/settle/:friendId", authMiddleware, expenseController.settleExpenses);
router.get("/report", authMiddleware, expenseController.getMasterReport);
router.get("/history/:friendId", authMiddleware, expenseController.getHistory);
router.post("/ledger", authMiddleware, expenseController.addLedgerEntry);
router.get("/show-ledger/:phone", authMiddleware, expenseController.getLedgerHistory);

module.exports = router;
