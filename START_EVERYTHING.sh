#!/bin/bash

echo "🚀 Starting Complete Microservices Platform"
echo "=============================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start infrastructure
echo "📦 Starting infrastructure (PostgreSQL, Redis, Kafka)..."
cd infrastructure
docker-compose up -d
echo "✅ Infrastructure started"
echo ""

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Create database and tables
echo "🗄️  Creating database and tables..."
docker exec -i postgres psql -U postgres -d order_system < ../database/001_create_products_table.sql 2>/dev/null
docker exec -i postgres psql -U postgres -d order_system < ../database/002_create_orders_table.sql 2>/dev/null
docker exec -i postgres psql -U postgres -d order_system < ../database/003_create_users_table.sql 2>/dev/null
echo "✅ Database setup complete"
echo ""

cd ..

# Install dependencies and start services in background
echo "📦 Installing dependencies for all services..."
echo ""

services=("api-gateway" "catalog-service" "booking-service" "payment-service" "integration-service")

for service in "${services[@]}"; do
    echo "  Installing $service..."
    cd services/$service
    npm install --silent > /dev/null 2>&1
    cd ../..
done

echo "✅ All dependencies installed"
echo ""

# Start frontend
echo "  Installing frontend..."
cd frontend
npm install --silent > /dev/null 2>&1
cd ..

echo "✅ Frontend dependencies installed"
echo ""

echo "=============================================="
echo "🎉 SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "Now start all services with these commands:"
echo ""
echo "Terminal 1 - API Gateway:"
echo "  cd services/api-gateway && npm start"
echo ""
echo "Terminal 2 - Catalog Service:"
echo "  cd services/catalog-service && npm start"
echo ""
echo "Terminal 3 - Booking Service:"
echo "  cd services/booking-service && npm start"
echo ""
echo "Terminal 4 - Payment Service:"
echo "  cd services/payment-service && npm start"
echo ""
echo "Terminal 5 - Integration Service (TikTok):"
echo "  cd services/integration-service && npm start"
echo ""
echo "Terminal 6 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "=============================================="
echo "URLs:"
echo "  🌐 Frontend:     http://localhost:3000"
echo "  🚪 API Gateway:  http://localhost:8080"
echo "  📦 Products:     http://localhost:8080/products"
echo "  📋 Bookings:     http://localhost:8080/bookings"
echo "=============================================="
