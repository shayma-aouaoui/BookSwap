# Penalty System Setup Guide

## Quick Start

The penalty system has been fully integrated into BookSwap. Here's what you need to know:

## 1. Database Migration

If you have an **existing database**, run the migration script:

```bash
cd backend
psql -d bookswap -f schema_penalty_migration.sql
```

Or if you're starting fresh, the updated `schema.sql` already includes all penalty system tables.

## 2. Environment Variables

Add these to your `backend/.env` file:

```env
# Penalty System Configuration
DAILY_PENALTY_RATE=1.00          # Penalty per day overdue (in your currency)
DEFAULT_LOAN_DURATION_DAYS=14    # Default loan period in days
```

## 3. Key Features Added

### Backend
- ✅ Due date tracking (set when request is accepted)
- ✅ Return date tracking
- ✅ Penalty calculation utilities
- ✅ Penalty management API routes
- ✅ Overdue book detection

### Frontend
- ✅ Penalties page (`/penalties`)
- ✅ Due date display on requests
- ✅ Overdue warnings
- ✅ Return book functionality
- ✅ Penalty summary on profile

## 4. How It Works

1. **When a request is accepted:**
   - `borrowed_at` = current timestamp
   - `due_date` = borrowed_at + 14 days (configurable)
   - Book status changes to 'reserved'

2. **When a book is overdue:**
   - System calculates days overdue
   - User can calculate penalty (manual trigger)
   - Penalty = days_overdue × daily_rate

3. **When a book is returned:**
   - `returned_at` = current timestamp
   - Request status changes to 'returned'
   - Book status changes back to 'available'

4. **Penalty payment:**
   - User pays penalty through the system
   - Penalty status changes to 'paid'
   - User's total penalty amount is updated

## 5. API Endpoints

### Penalties
- `GET /api/penalties/me` - Get user's penalties
- `GET /api/penalties/summary` - Get penalty summary
- `GET /api/penalties/check-overdue` - Get overdue books
- `POST /api/penalties/calculate/:requestId` - Calculate penalty
- `PUT /api/penalties/:id/pay` - Pay penalty
- `PUT /api/penalties/:id/waive` - Waive penalty (admin)

### Requests (Updated)
- `PUT /api/requests/:id/status` - Now sets due date when accepting
- `PUT /api/requests/:id/return` - Mark book as returned (NEW)

## 6. Frontend Routes

- `/penalties` - View and manage penalties
- `/requests` - Now shows due dates and overdue warnings
- `/profile` - Shows penalty summary

## 7. Customization

### Change Loan Duration

Update in `backend/.env`:
```env
DEFAULT_LOAN_DURATION_DAYS=21  # 3 weeks
```

### Change Penalty Rate

Update in `backend/.env`:
```env
DAILY_PENALTY_RATE=2.00  # $2 per day
```

### Modify Penalty Calculation

Edit `backend/utils/penaltyCalculator.js` to implement:
- Escalating penalties (more per day as time passes)
- Maximum penalty cap
- Grace period (no penalty for first X days)

## 8. Testing

1. Accept a book request
2. Check that due date is set (14 days from now)
3. View the request - should show due date
4. Wait for book to become overdue (or manually set due_date in DB)
5. Calculate penalty via `/penalties` page
6. Pay penalty
7. Mark book as returned

## Notes

- Penalties are **not automatically calculated** - user must trigger calculation
- Books can be returned even after overdue (penalties still apply)
- Admins can waive penalties for special circumstances
- All amounts use DECIMAL(10,2) for precision

For detailed documentation, see `PENALTY_SYSTEM.md`.


