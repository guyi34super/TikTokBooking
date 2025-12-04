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

# Create logs directory
mkdir -p logs

# Start infrastructure
echo "📦 Starting infrastructure (PostgreSQL, Redis, Kafka)..."
cd infrastructure

# Try docker compose (newer) first, then docker-compose (older)
if command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
    docker compose up -d
elif command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' command found"
    exit 1
fi

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

# Start all services in background
echo "=============================================="
echo "🚀 Starting all services..."
echo "=============================================="
echo ""

# Start API Gateway
echo "  Starting API Gateway..."
cd services/api-gateway
nohup npm start > ../../logs/api-gateway.log 2>&1 &
API_GATEWAY_PID=$!
echo $API_GATEWAY_PID > ../../logs/api-gateway.pid
cd ../..
sleep 2

# Start Catalog Service
echo "  Starting Catalog Service..."
cd services/catalog-service
nohup npm start > ../../logs/catalog-service.log 2>&1 &
CATALOG_PID=$!
echo $CATALOG_PID > ../../logs/catalog-service.pid
cd ../..
sleep 2

# Start Booking Service
echo "  Starting Booking Service..."
cd services/booking-service
nohup npm start > ../../logs/booking-service.log 2>&1 &
BOOKING_PID=$!
echo $BOOKING_PID > ../../logs/booking-service.pid
cd ../..
sleep 2

# Start Payment Service
echo "  Starting Payment Service..."
cd services/payment-service
nohup npm start > ../../logs/payment-service.log 2>&1 &
PAYMENT_PID=$!
echo $PAYMENT_PID > ../../logs/payment-service.pid
cd ../..
sleep 2

# Start Integration Service
echo "  Starting Integration Service..."
cd services/integration-service
nohup npm start > ../../logs/integration-service.log 2>&1 &
INTEGRATION_PID=$!
echo $INTEGRATION_PID > ../../logs/integration-service.pid
cd ../..
sleep 2

# Start Frontend
echo "  Starting Frontend..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..

echo ""
echo "✅ All services started!"
echo ""

# Wait a bit for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 5

echo ""
echo "=============================================="
echo "🎉 ALL SERVICES ARE RUNNING!"
echo "=============================================="
echo ""
echo "Process IDs saved in logs/*.pid files"
echo "Logs available in logs/*.log files"
echo ""
echo "=============================================="
echo "URLs:"
echo "  🌐 Frontend:     http://localhost:3000"
echo "  🚪 API Gateway:  http://localhost:8080"
echo "  📦 Products:     http://localhost:8080/products"
echo "  📋 Bookings:     http://localhost:8080/bookings"
echo "=============================================="
echo ""
echo "To view logs in real-time:"
echo "  tail -f logs/api-gateway.log"
echo "  tail -f logs/catalog-service.log"
echo "  tail -f logs/booking-service.log"
echo "  tail -f logs/payment-service.log"
echo "  tail -f logs/integration-service.log"
echo "  tail -f logs/frontend.log"
echo ""
echo "To stop all services:"
echo "  ./STOP_EVERYTHING.sh"
echo ""
echo "=============================================="
