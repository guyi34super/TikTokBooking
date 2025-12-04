-- Drop existing users table if exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with client/seller roles
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'seller', 'admin')),
    phone VARCHAR(50),
    profile_image VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create seller profiles table
CREATE TABLE seller_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_sales INTEGER DEFAULT 0,
    commission_rate DECIMAL(5, 2) DEFAULT 10.00,
    bank_account VARCHAR(255),
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sessions table for authentication
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update products table to include seller_id
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Update orders table to include seller_id and client_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);

-- Insert sample users
INSERT INTO users (email, password_hash, name, user_type, is_verified, is_active) VALUES
    ('admin@example.com', '$2a$10$dummy_hash_admin', 'Admin User', 'admin', true, true),
    ('client1@example.com', '$2a$10$dummy_hash_client1', 'John Doe', 'client', true, true),
    ('client2@example.com', '$2a$10$dummy_hash_client2', 'Jane Smith', 'client', true, true),
    ('seller1@example.com', '$2a$10$dummy_hash_seller1', 'Tech Solutions Inc', 'seller', true, true),
    ('seller2@example.com', '$2a$10$dummy_hash_seller2', 'Creative Designs Co', 'seller', true, true);

-- Insert seller profiles
INSERT INTO seller_profiles (user_id, business_name, description, category, rating, verification_status) VALUES
    (4, 'Tech Solutions Inc', 'Professional web and mobile development services', 'Technology', 4.8, 'verified'),
    (5, 'Creative Designs Co', 'Expert graphic design and branding services', 'Design', 4.9, 'verified');

-- Link existing products to sellers
UPDATE products SET seller_id = 4 WHERE type = 'service' AND name LIKE '%Development%';
UPDATE products SET seller_id = 5 WHERE type = 'service' AND name LIKE '%Design%';
UPDATE products SET seller_id = 4 WHERE type = 'product' AND name LIKE '%MacBook%' OR name LIKE '%iPhone%';
UPDATE products SET seller_id = 5 WHERE type = 'product' AND name LIKE '%iPad%' OR name LIKE '%AirPods%';

COMMENT ON TABLE users IS 'Main users table supporting clients, sellers, and admins';
COMMENT ON TABLE seller_profiles IS 'Extended profile information for sellers';
COMMENT ON COLUMN users.user_type IS 'Type of user: client (buyer), seller (provider), or admin';
