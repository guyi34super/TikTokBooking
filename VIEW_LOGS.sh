#!/bin/bash

# Get the workspace directory
WORKSPACE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOGS_DIR="$WORKSPACE_DIR/logs"

echo "📊 Microservices Platform - Log Viewer"
echo "=============================================="
echo ""

if [ ! -d "$LOGS_DIR" ]; then
    echo "❌ Logs directory not found. Services may not be running."
    exit 1
fi

# Check if a specific service was requested
if [ $# -eq 1 ]; then
    SERVICE=$1
    LOG_FILE="$LOGS_DIR/${SERVICE}.log"
    
    if [ -f "$LOG_FILE" ]; then
        echo "📝 Viewing logs for: $SERVICE"
        echo "Press Ctrl+C to exit"
        echo "=============================================="
        echo ""
        tail -f "$LOG_FILE"
    else
        echo "❌ Log file not found: $LOG_FILE"
        echo ""
        echo "Available services:"
        ls -1 "$LOGS_DIR"/*.log 2>/dev/null | xargs -n1 basename | sed 's/.log$//' | sed 's/^/  - /'
        exit 1
    fi
else
    echo "Available logs:"
    echo ""
    ls -1 "$LOGS_DIR"/*.log 2>/dev/null | xargs -n1 basename | sed 's/.log$//' | sed 's/^/  - /'
    echo ""
    echo "Usage: ./VIEW_LOGS.sh <service-name>"
    echo ""
    echo "Examples:"
    echo "  ./VIEW_LOGS.sh api-gateway"
    echo "  ./VIEW_LOGS.sh catalog-service"
    echo "  ./VIEW_LOGS.sh booking-service"
    echo "  ./VIEW_LOGS.sh payment-service"
    echo "  ./VIEW_LOGS.sh integration-service"
    echo "  ./VIEW_LOGS.sh frontend"
    echo ""
    echo "Or view all logs at once:"
    echo "  tail -f $LOGS_DIR/*.log"
fi
