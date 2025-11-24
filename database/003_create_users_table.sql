-- Create users table (optional for auth)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'provider')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample admin user
INSERT INTO users (email, name, role) VALUES
    ('admin@example.com', 'Admin User', 'admin'),
    ('user@example.com', 'Test User', 'user');
