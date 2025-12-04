#!/bin/bash

echo "🚀 Starting Complete Microservices Platform"
echo "=============================================="
echo ""

# Get the workspace directory
WORKSPACE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOGS_DIR="$WORKSPACE_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start infrastructure
echo "📦 Starting infrastructure (PostgreSQL, Redis, Kafka)..."
cd "$WORKSPACE_DIR/infrastructure"

# Try docker compose (new) first, fall back to docker-compose (old)
if docker compose version > /dev/null 2>&1; then
    docker compose up -d
elif command -v docker-compose > /dev/null 2>&1; then
    docker-compose up -d
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' is available."
    exit 1
fi

echo "✅ Infrastructure started"
echo ""

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Create database and tables
echo "🗄️  Creating database and tables..."
docker exec -i postgres psql -U postgres -d order_system < "$WORKSPACE_DIR/database/001_create_products_table.sql" 2>/dev/null
docker exec -i postgres psql -U postgres -d order_system < "$WORKSPACE_DIR/database/002_create_orders_table.sql" 2>/dev/null
docker exec -i postgres psql -U postgres -d order_system < "$WORKSPACE_DIR/database/003_create_users_table.sql" 2>/dev/null
echo "✅ Database setup complete"
echo ""

cd "$WORKSPACE_DIR"

# Install dependencies for all services
echo "📦 Installing dependencies for all services..."
echo ""

services=("api-gateway" "catalog-service" "booking-service" "payment-service" "integration-service")

for service in "${services[@]}"; do
    echo "  Installing $service..."
    cd "$WORKSPACE_DIR/services/$service"
    npm install --silent > /dev/null 2>&1
done

echo "✅ All dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$WORKSPACE_DIR/frontend"
npm install --silent > /dev/null 2>&1
echo "✅ Frontend dependencies installed"
echo ""

# Start all services
echo "🚀 Starting all services..."
echo ""

# Start API Gateway
echo "  Starting API Gateway..."
cd "$WORKSPACE_DIR/services/api-gateway"
npm start > "$LOGS_DIR/api-gateway.log" 2>&1 &
API_GATEWAY_PID=$!
echo $API_GATEWAY_PID > "$LOGS_DIR/api-gateway.pid"

# Start Catalog Service
echo "  Starting Catalog Service..."
cd "$WORKSPACE_DIR/services/catalog-service"
npm start > "$LOGS_DIR/catalog-service.log" 2>&1 &
CATALOG_PID=$!
echo $CATALOG_PID > "$LOGS_DIR/catalog-service.pid"

# Start Booking Service
echo "  Starting Booking Service..."
cd "$WORKSPACE_DIR/services/booking-service"
npm start > "$LOGS_DIR/booking-service.log" 2>&1 &
BOOKING_PID=$!
echo $BOOKING_PID > "$LOGS_DIR/booking-service.pid"

# Start Payment Service
echo "  Starting Payment Service..."
cd "$WORKSPACE_DIR/services/payment-service"
npm start > "$LOGS_DIR/payment-service.log" 2>&1 &
PAYMENT_PID=$!
echo $PAYMENT_PID > "$LOGS_DIR/payment-service.pid"

# Start Integration Service
echo "  Starting Integration Service..."
cd "$WORKSPACE_DIR/services/integration-service"
npm start > "$LOGS_DIR/integration-service.log" 2>&1 &
INTEGRATION_PID=$!
echo $INTEGRATION_PID > "$LOGS_DIR/integration-service.pid"

# Wait for services to initialize
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Start Frontend
echo "  Starting Frontend..."
cd "$WORKSPACE_DIR/frontend"
npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOGS_DIR/frontend.pid"

echo "✅ All services started"
echo ""

echo "=============================================="
echo "🎉 ALL SERVICES ARE NOW RUNNING!"
echo "=============================================="
echo ""
echo "📊 Service Status:"
echo "  API Gateway (PID: $API_GATEWAY_PID)"
echo "  Catalog Service (PID: $CATALOG_PID)"
echo "  Booking Service (PID: $BOOKING_PID)"
echo "  Payment Service (PID: $PAYMENT_PID)"
echo "  Integration Service (PID: $INTEGRATION_PID)"
echo "  Frontend (PID: $FRONTEND_PID)"
echo ""
echo "=============================================="
echo "🌐 URLs:"
echo "  Frontend:        http://localhost:3000"
echo "  API Gateway:     http://localhost:8080"
echo "  Products:        http://localhost:8080/products"
echo "  Bookings:        http://localhost:8080/bookings"
echo "=============================================="
echo ""
echo "📝 Logs are available in: $LOGS_DIR"
echo ""
echo "To view logs in real-time:"
echo "  tail -f $LOGS_DIR/api-gateway.log"
echo "  tail -f $LOGS_DIR/catalog-service.log"
echo "  tail -f $LOGS_DIR/booking-service.log"
echo "  tail -f $LOGS_DIR/payment-service.log"
echo "  tail -f $LOGS_DIR/integration-service.log"
echo "  tail -f $LOGS_DIR/frontend.log"
echo ""
echo "To stop all services, run:"
echo "  ./STOP_EVERYTHING.sh"
echo ""
echo "=============================================="
