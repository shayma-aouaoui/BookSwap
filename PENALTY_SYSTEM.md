# Penalty System Documentation

## Overview

The BookSwap penalty system tracks overdue books and applies penalties to users who don't return books on time. This encourages timely returns and maintains trust in the community.

## Features

### 1. **Due Date Tracking**
- When a book request is accepted, a due date is automatically set (default: 14 days)
- The due date is calculated from the `borrowed_at` timestamp
- Users can see due dates and days remaining on their requests

### 2. **Penalty Calculation**
- Penalties are calculated based on days overdue
- Default rate: $1.00 per day overdue
- Configurable via environment variable `DAILY_PENALTY_RATE`

### 3. **Penalty Management**
- Users can view their penalties
- Penalties can be paid through the system
- Admins can waive penalties
- Penalty history is tracked

### 4. **Return Tracking**
- Givers can mark books as returned
- Receivers can also mark books as returned
- Return date is recorded when a book is returned

## Database Schema

### Book Requests Table (Updated)
```sql
- borrowed_at: When the book was borrowed
- due_date: When the book should be returned
- returned_at: When the book was actually returned
- return_duration_days: Loan duration in days (default: 14)
```

### Penalties Table (New)
```sql
- id: UUID primary key
- request_id: Reference to book request
- user_id: User who owes the penalty
- penalty_amount: Amount of penalty
- penalty_type: Type (overdue, damaged, lost, other)
- status: pending, paid, waived, cancelled
- days_overdue: Number of days overdue
- calculated_at: When penalty was calculated
- paid_at: When penalty was paid
```

### Users Table (Updated)
```sql
- total_penalty_amount: Total penalties owed
- total_penalties_paid: Total penalties paid
```

## API Endpoints

### Penalties
- `GET /api/penalties/me` - Get current user's penalties
- `GET /api/penalties/summary` - Get penalty summary
- `GET /api/penalties/check-overdue` - Get overdue books
- `POST /api/penalties/calculate/:requestId` - Calculate penalty for overdue book
- `PUT /api/penalties/:id/pay` - Pay a penalty
- `PUT /api/penalties/:id/waive` - Waive penalty (admin only)

### Requests (Updated)
- `PUT /api/requests/:id/return` - Mark book as returned
- `PUT /api/requests/:id/status` - Now sets due date when accepting

## Configuration

### Environment Variables

Add to `backend/.env`:

```env
# Penalty system configuration
DAILY_PENALTY_RATE=1.00  # Penalty per day overdue
DEFAULT_LOAN_DURATION_DAYS=14  # Default loan period in days
```

## Workflow

### Book Borrowing Flow

1. **Request Created**: User requests a book
2. **Request Accepted**: Giver accepts the request
   - `borrowed_at` is set to current timestamp
   - `due_date` is calculated (borrowed_at + 14 days)
   - Book status changes to 'reserved'

### Book Return Flow

1. **Book Returned**: Giver or receiver marks book as returned
   - `returned_at` is set to current timestamp
   - Request status changes to 'returned'
   - Book status changes to 'available'

### Penalty Flow

1. **Overdue Detection**: System checks for overdue books
   - Books with `due_date < current_date` and no `returned_at`

2. **Penalty Calculation**: 
   - User or system triggers penalty calculation
   - Days overdue are calculated
   - Penalty amount = days_overdue × daily_rate

3. **Penalty Payment**:
   - User pays penalty
   - Penalty status changes to 'paid'
   - User's total_penalty_amount is updated

## Frontend Features

### Penalties Page
- View all penalties (pending, paid, waived)
- See penalty summary (total, pending, paid)
- Pay penalties
- View overdue books

### Requests Page
- See due dates for borrowed books
- Overdue warnings (red text)
- Days remaining indicator
- Return book button

### Profile Page
- Display total penalty amount
- Link to penalties page

## Migration

If you have an existing database, run the migration script:

```bash
psql -d bookswap -f backend/schema_penalty_migration.sql
```

Or manually add the columns:

```sql
ALTER TABLE book_requests 
ADD COLUMN IF NOT EXISTS borrowed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_duration_days INTEGER DEFAULT 14;

-- Then run the full schema.sql for the penalties table
```

## Customization

### Change Loan Duration

Update the default in `backend/.env`:
```env
DEFAULT_LOAN_DURATION_DAYS=21  # 3 weeks instead of 2
```

### Change Penalty Rate

Update the default in `backend/.env`:
```env
DAILY_PENALTY_RATE=2.00  # $2 per day instead of $1
```

### Custom Penalty Calculation

Modify `backend/utils/penaltyCalculator.js` to implement different penalty structures:

- **Escalating penalties**: More penalty per day as time passes
- **Maximum cap**: Limit total penalty amount
- **Grace period**: No penalty for first X days overdue

Example:
```javascript
function calculatePenaltyAmount(daysOverdue, dailyRate = DEFAULT_DAILY_PENALTY_RATE) {
  if (daysOverdue <= 7) {
    return daysOverdue * dailyRate;  // First week: normal rate
  } else if (daysOverdue <= 14) {
    return 7 * dailyRate + (daysOverdue - 7) * dailyRate * 2;  // Second week: double rate
  } else {
    return 7 * dailyRate + 7 * dailyRate * 2 + (daysOverdue - 14) * dailyRate * 3;  // After 2 weeks: triple rate
  }
}
```

## Notes

- Penalties are calculated when requested (not automatically)
- Books can be returned even after being overdue (penalties still apply)
- Admins can waive penalties for special circumstances
- Penalty amounts are stored as DECIMAL(10,2) for precision


