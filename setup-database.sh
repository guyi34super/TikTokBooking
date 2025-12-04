#!/bin/bash

echo "🗄️  Setting up PostgreSQL database..."
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Create database tables
echo "📝 Creating database tables..."

# Load schemas
docker exec -i postgres psql -U postgres -d order_system < database/001_create_products_table.sql
docker exec -i postgres psql -U postgres -d order_system < database/002_create_orders_table.sql
docker exec -i postgres psql -U postgres -d order_system < database/003_create_users_table.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Verifying data..."
docker exec -i postgres psql -U postgres -d order_system -c "SELECT id, name, type, price FROM products LIMIT 5;"

echo ""
echo "🎉 All done! You can now start your services."
