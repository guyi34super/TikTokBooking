#!/bin/bash

echo "🛑 Stopping Complete Microservices Platform"
echo "=============================================="
echo ""

# Get the workspace directory
WORKSPACE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOGS_DIR="$WORKSPACE_DIR/logs"

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="$LOGS_DIR/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "  Stopping $service_name (PID: $pid)..."
            kill $pid 2>/dev/null
            rm "$pid_file"
        else
            echo "  $service_name already stopped"
            rm "$pid_file"
        fi
    else
        echo "  $service_name PID file not found"
    fi
}

# Stop all services
echo "🔻 Stopping all services..."
echo ""

stop_service "api-gateway"
stop_service "catalog-service"
stop_service "booking-service"
stop_service "payment-service"
stop_service "integration-service"
stop_service "frontend"

echo ""
echo "🔻 Stopping infrastructure..."
cd "$WORKSPACE_DIR/infrastructure"

# Try docker compose (new) first, fall back to docker-compose (old)
if docker compose version > /dev/null 2>&1; then
    docker compose down
elif command -v docker-compose > /dev/null 2>&1; then
    docker-compose down
else
    echo "❌ Neither 'docker compose' nor 'docker-compose' is available."
fi

echo ""
echo "=============================================="
echo "✅ All services stopped!"
echo "=============================================="
echo ""
echo "To start again, run: ./START_EVERYTHING.sh"
echo ""
