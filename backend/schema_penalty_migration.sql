-- Migration script for penalty system
-- Run this after the initial schema.sql if you have an existing database

-- Add columns to book_requests table for tracking borrowing period
ALTER TABLE book_requests 
ADD COLUMN IF NOT EXISTS borrowed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_duration_days INTEGER DEFAULT 14; -- Default 14 days loan period

-- Update status constraint to include 'returned'
-- Note: PostgreSQL doesn't allow direct modification of CHECK constraints
-- If you get an error, you may need to drop and recreate the constraint
-- ALTER TABLE book_requests DROP CONSTRAINT IF EXISTS book_requests_status_check;
-- ALTER TABLE book_requests ADD CONSTRAINT book_requests_status_check 
--     CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'returned'));

-- Create penalties table
CREATE TABLE IF NOT EXISTS penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES book_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    penalty_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('overdue', 'damaged', 'lost', 'other')),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'cancelled')),
    days_overdue INTEGER,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add total_penalty_amount to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS total_penalty_amount DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_penalties_paid DECIMAL(10, 2) DEFAULT 0.00;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_penalties_user_id ON penalties(user_id);
CREATE INDEX IF NOT EXISTS idx_penalties_request_id ON penalties(request_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_due_date ON book_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_book_requests_status_due_date ON book_requests(status, due_date);

-- Trigger for updated_at on penalties
CREATE TRIGGER update_penalties_updated_at BEFORE UPDATE ON penalties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate overdue penalty (can be customized)
CREATE OR REPLACE FUNCTION calculate_overdue_penalty(days_overdue INTEGER, daily_penalty_rate DECIMAL DEFAULT 1.00)
RETURNS DECIMAL AS $$
BEGIN
    -- Basic calculation: daily_penalty_rate per day overdue
    -- Can be modified for different penalty structures (e.g., escalating penalties)
    RETURN days_overdue * daily_penalty_rate;
END;
$$ LANGUAGE plpgsql;

