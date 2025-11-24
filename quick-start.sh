#!/bin/bash

echo "🚀 Starting Order Tracking System Setup..."
echo ""

# Step 1: Database Setup
echo "📊 Step 1: Setting up database..."
createdb order_system 2>/dev/null || echo "Database already exists, continuing..."

echo "Running migrations..."
psql -d order_system -f database/001_create_products_table.sql
psql -d order_system -f database/002_create_orders_table.sql  
psql -d order_system -f database/003_create_users_table.sql

echo "Adding sample products..."
psql -d order_system << 'EOF'
INSERT INTO products (name, description, type, price, category, in_stock) VALUES
  ('Website Development', 'Full-stack web development service', 'service', 2500.00, 'development', true),
  ('Logo Design', 'Professional logo design service', 'service', 300.00, 'design', true),
  ('SEO Optimization', 'Search engine optimization', 'service', 500.00, 'marketing', true),
  ('MacBook Pro', 'High-performance laptop', 'product', 2399.00, 'electronics', true),
  ('Desk Chair', 'Ergonomic office chair', 'product', 450.00, 'furniture', true),
  ('Wireless Mouse', 'Bluetooth mouse', 'product', 29.99, 'accessories', true)
ON CONFLICT DO NOTHING;

INSERT INTO users (email, name, password_hash, role) VALUES
  ('admin@test.com', 'Admin User', 'hashed_password', 'admin'),
  ('user@test.com', 'Test User', 'hashed_password', 'user')
ON CONFLICT DO NOTHING;
EOF

echo "✅ Database setup complete!"
echo ""

# Step 2: Backend Setup
echo "🔧 Step 2: Setting up backend..."
mkdir -p backend
cd backend

if [ ! -f "package.json" ]; then
  npm init -y
  npm install express pg cors dotenv
  npm install --save-dev nodemon
fi

# Create .env file
cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_system
PORT=8080
ENVFILE

echo "✅ Backend dependencies installed!"
echo ""

# Step 3: Instructions
echo "================================================"
echo "🎉 Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm install"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📚 See SETUP_GUIDE.md for detailed instructions"
echo "================================================"
