
// Helper to calculate interest between two dates
const calculateInterest = (principal, rate, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // Interest = Principal * (Rate/100) * (Months)
  // Assuming Rate is per month. 
  // Using 30 days as a month standard for simplicity
  const months = diffDays / 30;
  return principal * (rate / 100) * months;
};

/**
 * Calculates current outstanding principal and overdue interest for a set of transactions.
 * Assumes transactions are sorted chronologically.
 * @param {Array} history - List of expense objects (transactions)
 * @param {String} userId - ID of the user viewing the report (Lender)
 * @returns {Object} { loans: Array, totalPrincipalOutstanding: Number, totalInterestOverdue: Number }
 */
const calculateUserBalance = (history, userId) => {
  const loans = [];
  let totalPrincipalOutstanding = 0;
  let totalInterestOverdue = 0;

  // Ensure history is sorted by date oldest to newest
  // Note: Caller should pass sorted history, but we can double check or rely on caller.
  // We will assume caller handles sort to avoid mutation side effects if possible, or copy.
  const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedHistory.forEach(tx => {
    const isLend = (tx.fromUserId === userId && tx.transactionType === 'LEND');
    const isRepayment = (tx.transactionType === 'ACCEPT'); 
    
    if (isLend) {
      // I Lent Money
      loans.push({
        id: tx.id,
        amount: tx.amount, // Remaining Principal
        initialAmount: tx.amount,
        date: tx.date,
        interestRate: tx.interestRate || 0,
        tenure: tx.tenure, // Store tenure for due date calc
        accruedInterest: 0,
        lastInterestCalcDate: tx.date,
        contactId: tx.contactId, // Keep track of contact
        friendId: tx.toUserId // Keep track of friend user id if available
      });
    } else if (isRepayment) {
         let repaymentAmount = tx.amount;
         const repaymentDate = tx.date;

         // 1. Update Interest on all loans up to this repayment date
         loans.forEach(loan => {
           if (loan.amount > 0) {
              const interest = calculateInterest(loan.amount, loan.interestRate, loan.lastInterestCalcDate, repaymentDate);
              loan.accruedInterest += interest;
              loan.lastInterestCalcDate = repaymentDate;
           }
         });

         // 2. Pay off Interest First
         for (let loan of loans) {
           if (repaymentAmount <= 0) break;
           
           if (loan.accruedInterest > 0) {
             const payInterest = Math.min(loan.accruedInterest, repaymentAmount);
             loan.accruedInterest -= payInterest;
             repaymentAmount -= payInterest;
           }
         }

         // 3. Pay off Principal (if allowed)
         if (!tx.repaymentType || tx.repaymentType === 'INTEREST_PRINCIPAL') {
           for (let loan of loans) {
             if (repaymentAmount <= 0) break;
             
             if (loan.amount > 0) {
               const payPrincipal = Math.min(loan.amount, repaymentAmount);
               loan.amount -= payPrincipal;
               repaymentAmount -= payPrincipal;
             }
           }
         }
    }
  });

  // Final Calculation to Now
  const now = new Date();
  loans.forEach(loan => {
    if (loan.amount > 0) {
      const interest = calculateInterest(loan.amount, loan.interestRate, loan.lastInterestCalcDate, now);
      loan.accruedInterest += interest;
      loan.lastInterestCalcDate = now; 
    }
    
    totalPrincipalOutstanding += loan.amount;
    totalInterestOverdue += loan.accruedInterest;
  });

  return {
    loans,
    totalPrincipalOutstanding,
    totalInterestOverdue
  };
};

module.exports = { calculateUserBalance };
