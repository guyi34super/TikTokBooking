# Quick Start Guide

## 🚀 Starting Everything

To start all microservices, infrastructure, and the frontend automatically:

```bash
./START_EVERYTHING.sh
```

This script will:
- ✅ Check if Docker is running
- 📦 Start infrastructure (PostgreSQL, Redis, Kafka)
- 🗄️ Set up databases and tables
- 📦 Install all dependencies
- 🚀 Start all microservices in the background
- 🌐 Start the frontend application
- 📝 Create log files for each service

## 🛑 Stopping Everything

To stop all services and infrastructure:

```bash
./STOP_EVERYTHING.sh
```

## 📊 Viewing Logs

To view logs for a specific service:

```bash
./VIEW_LOGS.sh <service-name>
```

Examples:
```bash
./VIEW_LOGS.sh api-gateway
./VIEW_LOGS.sh catalog-service
./VIEW_LOGS.sh frontend
```

To view all logs at once:
```bash
tail -f logs/*.log
```

## 🌐 Service URLs

Once everything is running, access the services at:

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Products API**: http://localhost:8080/products
- **Bookings API**: http://localhost:8080/bookings

## 📁 Log Files

All service logs are stored in the `logs/` directory:
- `api-gateway.log`
- `catalog-service.log`
- `booking-service.log`
- `payment-service.log`
- `integration-service.log`
- `frontend.log`

## 🔧 Troubleshooting

### Services not starting?
Check the logs for errors:
```bash
cat logs/<service-name>.log
```

### Port already in use?
Stop all services and try again:
```bash
./STOP_EVERYTHING.sh
./START_EVERYTHING.sh
```

### Docker issues?
Make sure Docker is running:
```bash
docker info
```

## 📋 Manual Service Management

If you need to start/stop services individually:

### Start a single service:
```bash
cd services/<service-name>
npm start
```

### Stop a single service:
```bash
# Find the PID
cat logs/<service-name>.pid

# Kill the process
kill <PID>
```

## ⚙️ Service Ports

- API Gateway: 8080
- Catalog Service: 8081
- Booking Service: 8082
- Payment Service: 8083
- Integration Service: 8084
- Frontend: 3000
- PostgreSQL: 5432
- Redis: 6379
- Kafka: 9092
