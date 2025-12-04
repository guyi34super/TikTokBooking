-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('product', 'service')),
    price DECIMAL(10, 2) NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO products (name, type, price, in_stock) VALUES
    ('Web Development Service', 'service', 2500.00, true),
    ('Mobile App Development', 'service', 5000.00, true),
    ('Logo Design', 'service', 300.00, true),
    ('SEO Optimization', 'service', 800.00, true),
    ('MacBook Pro', 'product', 2499.00, true),
    ('iPhone 15', 'product', 999.00, true),
    ('AirPods Pro', 'product', 249.00, true),
    ('iPad Air', 'product', 599.00, false);

CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_in_stock ON products(in_stock);
