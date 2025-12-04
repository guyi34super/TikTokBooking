#!/bin/bash

echo "🔍 Diagnostic Report"
echo "=============================================="
echo ""

echo "📍 Current Directory:"
pwd
echo ""

echo "🌿 Current Branch:"
git branch --show-current 2>/dev/null || echo "Not a git repository"
echo ""

echo "📊 Service PIDs from PID files:"
echo "=============================================="
if [ -d "logs" ]; then
    for pidfile in logs/*.pid; do
        if [ -f "$pidfile" ]; then
            service=$(basename "$pidfile" .pid)
            pid=$(cat "$pidfile" 2>/dev/null)
            if ps -p $pid > /dev/null 2>&1; then
                echo "✅ $service (PID $pid) - RUNNING"
            else
                echo "❌ $service (PID $pid) - NOT RUNNING (stale PID)"
            fi
        fi
    done
else
    echo "⚠️  No logs directory found"
fi
echo ""

echo "🔌 Ports in Use:"
echo "=============================================="
for port in 3000 3001 3002 3003 3004 3008 8080; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        pid=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null | head -1)
        process=$(ps -p $pid -o comm= 2>/dev/null)
        echo "✅ Port $port - IN USE (PID $pid - $process)"
    else
        echo "❌ Port $port - NOT IN USE"
    fi
done
echo ""

echo "🐳 Docker Containers:"
echo "=============================================="
if docker ps > /dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo "❌ Docker not running or not accessible"
fi
echo ""

echo "📝 Recent Log Entries:"
echo "=============================================="
if [ -d "logs" ]; then
    echo "--- API Gateway (last 5 lines) ---"
    if [ -f "logs/api-gateway.log" ]; then
        tail -5 logs/api-gateway.log 2>/dev/null || echo "Empty or no log"
    else
        echo "No log file found"
    fi
    echo ""
    
    echo "--- User Service (last 5 lines) ---"
    if [ -f "logs/user-service.log" ]; then
        tail -5 logs/user-service.log 2>/dev/null || echo "Empty or no log"
    else
        echo "No log file found"
    fi
else
    echo "⚠️  No logs directory found"
fi
echo ""

echo "🧪 Quick API Tests:"
echo "=============================================="

# Test API Gateway health
echo -n "API Gateway Health: "
if curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ RESPONDING"
    curl -s http://localhost:8080/health | head -c 100
    echo ""
else
    echo "❌ NOT RESPONDING"
fi
echo ""

# Test User Service directly
echo -n "User Service (direct): "
if curl -s -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ RESPONDING"
else
    echo "❌ NOT RESPONDING"
fi
echo ""

# Test login endpoint
echo -n "Login Endpoint: "
LOGIN_TEST=$(curl -s -X POST http://localhost:8080/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"client1@example.com","password":"password123"}' 2>&1)

if echo "$LOGIN_TEST" | grep -q "token"; then
    echo "✅ WORKING - Login successful"
elif echo "$LOGIN_TEST" | grep -q "proxy"; then
    echo "❌ PROXY ERROR - User service not reachable"
    echo "   $LOGIN_TEST"
else
    echo "⚠️  UNEXPECTED RESPONSE"
    echo "   $(echo "$LOGIN_TEST" | head -c 100)"
fi
echo ""

echo "=============================================="
echo "💡 Recommendations:"
echo "=============================================="

# Check for common issues
issues_found=0

# Check if all ports are in use
for port in 8080 3001; do
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        if [ $issues_found -eq 0 ]; then
            echo "Issues detected:"
            issues_found=1
        fi
        echo "  ⚠️  Port $port is not in use - service may not be running"
    fi
done

# Check if user service is running
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    if [ $issues_found -eq 0 ]; then
        echo "Issues detected:"
        issues_found=1
    fi
    echo "  ⚠️  User service (port 3001) is critical for authentication"
    echo "     Try: cd services/user-service && npm install && npm start"
fi

if [ $issues_found -eq 0 ]; then
    echo "✅ No obvious issues detected!"
    echo ""
    echo "If you're still having problems:"
    echo "  1. Check logs: tail -f logs/*.log"
    echo "  2. Run tests: ./TEST_ALL.sh"
    echo "  3. Try restart: ./STOP_EVERYTHING.sh && ./START_EVERYTHING.sh"
fi

echo ""
echo "=============================================="
