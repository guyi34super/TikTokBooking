#!/bin/bash

echo "🔍 Checking Service Status"
echo "=============================================="
echo ""

# Function to check if a port is listening
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z localhost $port 2>/dev/null; then
        echo "✅ $service is running on port $port"
        return 0
    else
        echo "❌ $service is NOT running on port $port"
        return 1
    fi
}

# Check all services
check_port 8080 "API Gateway"
check_port 3001 "User Service"
check_port 3002 "Catalog Service"
check_port 3003 "Booking Service"
check_port 3004 "Payment Service"
check_port 3008 "Integration Service"
check_port 3000 "Frontend"

echo ""
echo "=============================================="
echo "Docker Containers:"
echo "=============================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not running or no containers"

echo ""
echo "=============================================="
echo "Process Status:"
echo "=============================================="
if pgrep -f "node.*services" > /dev/null; then
    echo "Node processes running:"
    ps aux | grep -E "node.*(api-gateway|catalog|booking|payment|integration|user)" | grep -v grep
else
    echo "No Node.js service processes found"
fi

echo ""
echo "=============================================="
echo "Quick Fix:"
echo "=============================================="
echo "To start all services, run:"
echo "  ./START_EVERYTHING.sh"
echo ""
echo "To check logs:"
echo "  tail -f logs/*.log"
