-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('giver', 'receiver')),
    location VARCHAR(255),
    interests TEXT[],
    bio TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    total_penalty_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_penalties_paid DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    giver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    description TEXT,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'exchanged')),
    location VARCHAR(255),
    image_urls TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book requests table
CREATE TABLE IF NOT EXISTS book_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'returned')),
    message TEXT,
    borrowed_at TIMESTAMP,
    due_date TIMESTAMP,
    returned_at TIMESTAMP,
    return_duration_days INTEGER DEFAULT 14,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, receiver_id, status)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES book_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book summaries (Community Knowledge Layer)
CREATE TABLE IF NOT EXISTS book_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT NOT NULL,
    personal_insight TEXT,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, user_id)
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_user_id, to_user_id, book_id)
);

-- Reading lists
CREATE TABLE IF NOT EXISTS reading_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    list_type VARCHAR(50) DEFAULT 'reading' CHECK (list_type IN ('reading', 'wishlist', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id, list_type)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Activity feed (for newly added books and other events)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Penalties table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_giver_id ON books(giver_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_book_requests_book_id ON book_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_receiver_id ON book_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_book_summaries_book_id ON book_summaries(book_id);
CREATE INDEX IF NOT EXISTS idx_ratings_to_user_id ON ratings(to_user_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_penalties_user_id ON penalties(user_id);
CREATE INDEX IF NOT EXISTS idx_penalties_request_id ON penalties(request_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON penalties(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_due_date ON book_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_book_requests_status_due_date ON book_requests(status, due_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_requests_updated_at BEFORE UPDATE ON book_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_summaries_updated_at BEFORE UPDATE ON book_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalties_updated_at BEFORE UPDATE ON penalties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate overdue penalty
CREATE OR REPLACE FUNCTION calculate_overdue_penalty(days_overdue INTEGER, daily_penalty_rate DECIMAL DEFAULT 1.00)
RETURNS DECIMAL AS $$
BEGIN
    -- Basic calculation: daily_penalty_rate per day overdue
    -- Can be modified for different penalty structures (e.g., escalating penalties)
    RETURN days_overdue * daily_penalty_rate;
END;
$$ LANGUAGE plpgsql;


