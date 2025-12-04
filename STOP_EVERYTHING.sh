#!/bin/bash

echo "🛑 Stopping All Microservices"
echo "=============================================="
echo ""

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "  Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null
            sleep 1
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            rm "$pid_file"
            echo "  ✅ $service_name stopped"
        else
            echo "  ⚠️  $service_name is not running (PID: $pid)"
            rm "$pid_file"
        fi
    else
        echo "  ⚠️  No PID file found for $service_name"
    fi
}

# Stop all services
echo "Stopping services..."
echo ""

stop_service "user-service"
stop_service "api-gateway"
stop_service "catalog-service"
stop_service "booking-service"
stop_service "payment-service"
stop_service "integration-service"
stop_service "frontend"

echo ""
echo "Stopping Docker infrastructure..."
cd infrastructure

# Try docker compose (newer) first, then docker-compose (older)
if command -v docker &> /dev/null && docker compose version &> /dev/null 2>&1; then
    docker compose down
elif command -v docker-compose &> /dev/null; then
    docker-compose down
else
    echo "⚠️  Could not find docker compose command"
fi

cd ..

echo ""
echo "=============================================="
echo "✅ All services stopped!"
echo "=============================================="
