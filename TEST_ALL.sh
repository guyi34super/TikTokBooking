#!/bin/bash

echo "🧪 Testing All Services"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_passed=0
test_failed=0

# Function to test an endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    local expected_status=${5:-200}
    
    echo -n "Testing $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "$expected_status" ] || [ "$http_code" -ge 200 -a "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        test_passed=$((test_passed + 1))
        if [ -n "$body" ]; then
            echo "   Response: $(echo "$body" | head -c 100)..."
        fi
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        test_failed=$((test_failed + 1))
        if [ -n "$body" ]; then
            echo "   Error: $body"
        fi
        return 1
    fi
}

# Function to check if port is listening
check_port() {
    local port=$1
    local service=$2
    
    echo -n "Checking $service (port $port)... "
    
    if nc -z localhost $port 2>/dev/null || lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Running${NC}"
        return 1
    fi
}

echo "Step 1: Checking if services are listening on ports"
echo "=============================================="
check_port 8080 "API Gateway"
check_port 3001 "User Service"
check_port 3002 "Catalog Service"
check_port 3003 "Booking Service"
check_port 3004 "Payment Service"
check_port 3008 "Integration Service"
check_port 3000 "Frontend"
echo ""

echo "Step 2: Testing API Gateway"
echo "=============================================="
test_endpoint "Health Check" "http://localhost:8080/health"
echo ""

echo "Step 3: Testing Authentication (Public Routes)"
echo "=============================================="

# Test login with existing user
echo "Testing login with client1@example.com..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "email": "client1@example.com",
        "password": "password123"
    }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ Login Successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token received: ${TOKEN:0:20}..."
    test_passed=$((test_passed + 1))
else
    echo -e "${RED}❌ Login Failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    test_failed=$((test_failed + 1))
    TOKEN=""
fi
echo ""

if [ -n "$TOKEN" ]; then
    echo "Step 4: Testing Protected Routes (with authentication)"
    echo "=============================================="
    
    # Test products endpoint
    echo -n "Testing GET /products... "
    PRODUCTS_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:8080/products)
    
    PRODUCTS_CODE=$(echo "$PRODUCTS_RESPONSE" | tail -n1)
    PRODUCTS_BODY=$(echo "$PRODUCTS_RESPONSE" | head -n-1)
    
    if [ "$PRODUCTS_CODE" -ge 200 -a "$PRODUCTS_CODE" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $PRODUCTS_CODE)"
        test_passed=$((test_passed + 1))
        echo "   Products: $(echo "$PRODUCTS_BODY" | head -c 80)..."
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $PRODUCTS_CODE)"
        test_failed=$((test_failed + 1))
        echo "   Error: $PRODUCTS_BODY"
    fi
    
    # Test user profile
    echo -n "Testing GET /auth/me... "
    ME_RESPONSE=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:8080/auth/me)
    
    ME_CODE=$(echo "$ME_RESPONSE" | tail -n1)
    ME_BODY=$(echo "$ME_RESPONSE" | head -n-1)
    
    if [ "$ME_CODE" -ge 200 -a "$ME_CODE" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $ME_CODE)"
        test_passed=$((test_passed + 1))
        echo "   User: $(echo "$ME_BODY" | head -c 80)..."
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $ME_CODE)"
        test_failed=$((test_failed + 1))
        echo "   Error: $ME_BODY"
    fi
    
    echo ""
else
    echo -e "${YELLOW}⚠️  Skipping protected route tests (no token)${NC}"
    echo ""
fi

echo "Step 5: Testing Public Browse Endpoints"
echo "=============================================="
test_endpoint "Browse Products" "http://localhost:8080/products/browse"
test_endpoint "View Sellers" "http://localhost:8080/sellers"
echo ""

echo "=============================================="
echo "📊 Test Summary"
echo "=============================================="
echo -e "Tests Passed: ${GREEN}$test_passed${NC}"
echo -e "Tests Failed: ${RED}$test_failed${NC}"
echo ""

if [ $test_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! System is working correctly.${NC}"
    echo ""
    echo "🎉 You can now:"
    echo "  • Open http://localhost:3000 in your browser"
    echo "  • Login with: client1@example.com / password123"
    echo "  • Start using the application!"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Check the logs:${NC}"
    echo "  tail -f logs/*.log"
    echo ""
    echo "Or check specific service logs:"
    echo "  tail -f logs/api-gateway.log"
    echo "  tail -f logs/user-service.log"
    exit 1
fi
