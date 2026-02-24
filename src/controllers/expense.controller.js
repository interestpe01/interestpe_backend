const Expense = require("../models/expense.model");
const { Op } = require("sequelize");
const Contact = require("../models/contact.model");
const User = require("../models/user.model");
const { calculateUserBalance } = require("../utils/calculationUtils");

exports.addExpense = async (req, res) => {
  try {
    const { friendId, amount, note, interest, tenure, date, type, repaymentType } = req.body; // type: 'LEND' or 'ACCEPT'
    const fromUserId = req.user.id;

    // Check if friendId corresponds to a Contact entry
    const contact = await Contact.findByPk(friendId);
    
    if (!contact) {
      return res.status(404).json({ msg: "Friend (Contact) not found. Please add person as a contact first." });
    }

    let contactId = contact.id;
    let toUserId = contact.friendId; // Can be null if contact is not registered


    const expense = await Expense.create({
      fromUserId,
      toUserId,
      contactId,
      amount,
      message: note,
      interestRate: interest,
      tenure,
      date,
      transactionType: type || "LEND",
      repaymentType: (type === "ACCEPT") ? repaymentType : null
    });

    return res.json({ msg: "Expense added, pending confirmation", expense });
  } catch (err) {
    console.error(err);
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
    const { friendId } = req.params; // Expecting Contact ID here mostly
    const userId = req.user.id;

    // Check if friendId is a valid Contact ID belonging to the user
    const contact = await Contact.findOne({ where: { id: friendId, userId } });
    
    let whereClause = {};

    if (contact) {
      // It's a Contact ID
      whereClause = {
         contactId: friendId
      };
      
      // If contact is linked to a user, also fetch transactions where that user might have sent money to us (ACCEPT from them)
      // Actually, if we recorded it, we recorded it under this contactId mainly. 
      // But if it was initiated by the other user (if they are registered), it might not have our contactId.
      // For simplicity/1-to-1 independent view: we just fetch expenses linked to this contactId OR where toUserId/fromUserId matches.
      
      if (contact.friendId) {
        whereClause = {
          [Op.or]: [
            { contactId: friendId },
            { fromUserId: userId, toUserId: contact.friendId },
            { fromUserId: contact.friendId, toUserId: userId }
          ]
        };
      }
    } else {
      // Maybe it was forcibly passed as a User ID (legacy support or direct link)
      // Or simply invalid
       whereClause = {
        [Op.or]: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId }
        ]
      };
    }

    const history = await Expense.findAll({
      where: whereClause,
      order: [['date', 'ASC'], ['createdAt', 'ASC']] // Sort Oldest first for calculation
    });

    const calculationResult = calculateUserBalance(history, userId);

    // Sort history back to DESC for display
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ 
      history, 
      principalOutstanding: calculationResult.totalPrincipalOutstanding,
      interestOverdue: calculationResult.totalInterestOverdue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching history" });
  }
};

exports.getMasterReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, date } = req.query; // type: 'friends' or 'duedate'. date: optional filter for due date.

    // 1. Fetch ALL transactions involving the user
    const expenses = await Expense.findAll({
      where: {
        [Op.or]: [
          { fromUserId: userId },
          { toUserId: userId }
        ]
      }
      // We don't need sorting here yet, the helper does it, or we do it per group
    });

    if (type === 'friends') {
      // Group by Friend/Contact
      // We need to identify who the "Friend" is in each transaction relative to the User.
      const friendMap = {}; // friendId -> [transactions]

      expenses.forEach(tx => {
        let otherId = null;
        if (tx.fromUserId === userId) otherId = tx.toUserId;
        else otherId = tx.fromUserId;
        
        if (otherId) {
          if (!friendMap[otherId]) friendMap[otherId] = [];
          friendMap[otherId].push(tx);
        }
      });

      const report = [];
      const friendIds = Object.keys(friendMap);

      // We might want to fetch Contact details for names? 
      // For now returning IDs and calculated values.
      // OPTIONAL: Fetch Contact names if needed.
      const contacts = await Contact.findAll({
          where: {
              userId,
              friendId: { [Op.in]: friendIds }
          }
      });
      
      const contactNameMap = {};
      contacts.forEach(c => contactNameMap[c.friendId] = c.name);

      for (const fId of friendIds) {
        const txs = friendMap[fId];
        const result = calculateUserBalance(txs, userId);
        
        // Only include if there is outstanding balance? Or provide all?
        // Usually report shows active debts.
        if (result.totalPrincipalOutstanding > 0 || result.totalInterestOverdue > 0) {
            report.push({
                friendId: fId,
                name: contactNameMap[fId] || "Unknown",
                principalOutstanding: result.totalPrincipalOutstanding,
                interestOverdue: result.totalInterestOverdue
            });
        }
      }

      return res.json({ report });

    } else if (type === 'duedate') {
      // 1. Calculate all loans for everyone
      const result = calculateUserBalance(expenses, userId);
      let activeLoans = result.loans.filter(l => l.amount > 0);

      // 2. Calculate Due Dates
      // Due Date = Loan Date + Tenure (Months?). 
      // If tenure is missing, default to 30 days.
      
      const loansWithDueDate = activeLoans.map(loan => {
         const loanDate = new Date(loan.date);
         let dueDate = new Date(loanDate);
         
         if (loan.tenure) {
             // Assuming tenure is in Months
             dueDate.setMonth(dueDate.getMonth() + loan.tenure);
         } else {
             // Default 30 days
             dueDate.setDate(dueDate.getDate() + 30);
         }
         
         return {
             ...loan,
             dueDate: dueDate.toISOString().split('T')[0]
         };
      });

      // 3. Filter if date is provided
      if (date) {
          // Exact match?
          loansWithDueDate = loansWithDueDate.filter(l => l.dueDate === date);
      }

      // 4. Sort by Due Date (Earliest first)
      loansWithDueDate.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      return res.json({ report: loansWithDueDate });

    } else {
        return res.status(400).json({ msg: "Invalid type. Use 'friends' or 'duedate'." });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error generating report" });
  }
};


exports.settleExpenses = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

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

exports.addLedgerEntry = async (req, res) => {
  try {
    const { phone, amount, description, type } = req.body;
    const fromUserId = req.user.id;

    if (!phone || !amount || !type) {
      return res.status(400).json({ msg: "Please provide phone, amount, and type." });
    }

    // 1. Identify if a registered user exists with this phone
    const registeredUser = await User.findOne({ where: { phoneNumber: phone } });
    const toUserId = registeredUser ? registeredUser.userId : null;

    // 2. Find or create a contact for the current user
    let contact = await Contact.findOne({ where: { userId: fromUserId, phoneNumber: phone } });
    
    if (!contact) {
      contact = await Contact.create({
        userId: fromUserId,
        friendId: toUserId,
        phoneNumber: phone,
        name: registeredUser ? (registeredUser.fullName || registeredUser.username) : phone
      });
    } else if (toUserId && !contact.friendId) {
      // Update contact if user just registered
      contact.friendId = toUserId;
      await contact.save();
    }

    // 3. Map type to transactionType
    // debit = Loan given (LEND)
    // credit = Loan taken (ACCEPT)
    const transactionType = type.toLowerCase() === "debit" ? "LEND" : "ACCEPT";

    // 4. Create the expense (ledger entry)
    // We auto-confirm these as they are "ledger entries"
    const expense = await Expense.create({
      fromUserId,
      toUserId,
      contactId: contact.id,
      amount,
      message: description,
      status: "confirmed",
      transactionType,
      date: new Date().toISOString().split('T')[0] // today's date
    });

    return res.json({ msg: "Ledger entry added successfully", expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error adding ledger entry" });
  }
};

exports.getLedgerHistory = async (req, res) => {
  try {
    const { phone } = req.params;
    const userId = req.user.id;

    // 1. Find the contact for this phone number
    const contact = await Contact.findOne({ where: { userId, phoneNumber: phone } });
    
    if (!contact) {
      return res.status(404).json({ msg: "Contact not found for this phone number." });
    }

    // 2. Fetch all expenses linked to this contact or between the two users
    let whereClause = { contactId: contact.id };
    if (contact.friendId) {
      whereClause = {
        [Op.or]: [
          { contactId: contact.id },
          { fromUserId: userId, toUserId: contact.friendId },
          { fromUserId: contact.friendId, toUserId: userId }
        ]
      };
    }

    const history = await Expense.findAll({
      where: whereClause,
      order: [['date', 'ASC'], ['createdAt', 'ASC']]
    });

    const calculationResult = calculateUserBalance(history, userId);

    // Sort back to DESC for display
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ 
      phone,
      contactName: contact.name,
      history, 
      principalOutstanding: calculationResult.totalPrincipalOutstanding,
      interestOverdue: calculationResult.totalInterestOverdue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching ledger history" });
  }
};
