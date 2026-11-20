/**
 * Penalty calculation utilities
 */

// Default daily penalty rate (can be configured via environment variable)
const DEFAULT_DAILY_PENALTY_RATE = parseFloat(process.env.DAILY_PENALTY_RATE) || 1.00;
const DEFAULT_LOAN_DURATION_DAYS = parseInt(process.env.DEFAULT_LOAN_DURATION_DAYS) || 14;

/**
 * Calculate days overdue from due date
 * @param {Date|string} dueDate - The due date
 * @returns {number} Number of days overdue (0 if not overdue)
 */
function calculateDaysOverdue(dueDate) {
  if (!dueDate) return 0;
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = now - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculate penalty amount for overdue days
 * @param {number} daysOverdue - Number of days overdue
 * @param {number} dailyRate - Daily penalty rate (default from env)
 * @returns {number} Total penalty amount
 */
function calculatePenaltyAmount(daysOverdue, dailyRate = DEFAULT_DAILY_PENALTY_RATE) {
  if (daysOverdue <= 0) return 0;
  
  // Simple linear calculation: days * rate
  // Can be modified for escalating penalties (e.g., first 7 days = 1, next 7 = 2, etc.)
  return daysOverdue * dailyRate;
}

/**
 * Calculate due date from borrow date
 * @param {Date|string} borrowedAt - When the book was borrowed
 * @param {number} durationDays - Loan duration in days (default 14)
 * @returns {Date} Due date
 */
function calculateDueDate(borrowedAt, durationDays = DEFAULT_LOAN_DURATION_DAYS) {
  const borrowed = new Date(borrowedAt);
  const due = new Date(borrowed);
  due.setDate(due.getDate() + durationDays);
  return due;
}

/**
 * Check if a book is overdue
 * @param {Date|string} dueDate - The due date
 * @returns {boolean} True if overdue
 */
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return calculateDaysOverdue(dueDate) > 0;
}

/**
 * Get penalty status for a request
 * @param {Object} request - Book request object with due_date and returned_at
 * @returns {Object} Penalty information
 */
function getPenaltyInfo(request) {
  if (!request.due_date || request.returned_at) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      penaltyAmount: 0
    };
  }

  const daysOverdue = calculateDaysOverdue(request.due_date);
  const penaltyAmount = calculatePenaltyAmount(daysOverdue);

  return {
    isOverdue: daysOverdue > 0,
    daysOverdue,
    penaltyAmount
  };
}

module.exports = {
  calculateDaysOverdue,
  calculatePenaltyAmount,
  calculateDueDate,
  isOverdue,
  getPenaltyInfo,
  DEFAULT_DAILY_PENALTY_RATE,
  DEFAULT_LOAN_DURATION_DAYS
};


