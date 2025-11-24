# 🚀 Microservices Quick Start Guide

## Complete System - Ready to Run!

This is a **production-ready microservices platform** with 9 services, event-driven architecture, and TikTok integration.

## 🏗️ What You Have

### ✅ 9 Microservices (Fully Implemented)
1. **API Gateway** (Port 8080) - Routes all requests
2. **User Service** (Port 3001) - Auth & profiles  
3. **Catalog Service** (Port 3002) - Products/services
4. **Booking Service** (Port 3003) - Core booking logic
5. **Payment Service** (Port 3004) - Stripe integration
6. **Receipt Service** (Port 3005) - PDF generation
7. **Notification Service** (Port 3006) - Email/SMS
8. **Location Service** (Port 3007) - Google Maps
9. **Integration Service** (Port 3008) - TikTok tracking

### ✅ Infrastructure
- PostgreSQL (9 databases - one per service)
- Redis (caching, sessions)
- Kafka (event streaming)
- Elasticsearch (search)
- MinIO (S3-compatible storage)

### ✅ Frontend
- React SPA with TypeScript
- Beautiful UI
- Real-time updates

---

## 🚀 Run Everything (5 Steps)

### Step 1: Start Infrastructure (1 minute)

```bash
cd /workspace/infrastructure
docker-compose up -d
```

Wait for all services to be healthy:
```bash
docker-compose ps
```

### Step 2: Verify Infrastructure

```bash
# PostgreSQL
psql -U postgres -h localhost -l

# Kafka
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Redis
redis-cli ping
```

### Step 3: Run Database Migrations

```bash
cd /workspace
./scripts/run-migrations.sh
```

### Step 4: Start All Services

**Option A: Use the start script (Recommended)**
```bash
./scripts/start-all-services.sh
```

**Option B: Start manually** (open 10 terminals)
```bash
# Terminal 1 - API Gateway
cd services/api-gateway && npm install && npm start

# Terminal 2 - User Service  
cd services/user-service && npm install && npm run dev

# Terminal 3 - Catalog Service
cd services/catalog-service && npm install && npm run dev

# Terminal 4 - Booking Service
cd services/booking-service && npm install && npm run dev

# Terminal 5 - Payment Service
cd services/payment-service && npm install && npm run dev

# Terminal 6 - Receipt Service
cd services/receipt-service && npm install && npm run dev

# Terminal 7 - Notification Service
cd services/notification-service && npm install && npm run dev

# Terminal 8 - Location Service
cd services/location-service && npm install && npm run dev

# Terminal 9 - Integration Service (TikTok)
cd services/integration-service && npm install && npm run dev

# Terminal 10 - Frontend
cd frontend && npm install && npm run dev
```

### Step 5: Access the Application

Open your browser:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

---

## 🎯 What You Can Do

### 1. Browse Products
- Go to http://localhost:3000
- See products and services
- Filter by type

### 2. Create Booking
- Add items to cart
- Place order
- System creates booking (PENDING status)

### 3. Process Payment
- Booking Service emits `booking.created` event
- Payment Service creates Stripe PaymentIntent
- Frontend shows payment form
- Complete payment

### 4. Track Events
Event flow through Kafka:
```
booking.created 
  → payment.succeeded 
    → booking.confirmed
      → receipt.generated
        → notification.sent
          → tiktok.event.tracked
```

### 5. TikTok Integration
When payment succeeds:
- Integration Service sends event to TikTok
- Tracks: order_id, value, currency, user (hashed)
- Attribution data (UTM params, click_id)

### 6. Admin Dashboard
- Toggle "Admin Mode"
- View all bookings
- See revenue stats
- Mark orders as paid manually

---

## 📊 Architecture Overview

```
┌─────────────┐
│   Frontend  │ (React, Port 3000)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│           API Gateway (Port 8080)            │
│  Kong / Express Gateway                      │
│  - Authentication                            │
│  - Rate Limiting                             │
│  - Routing                                   │
└──────┬───────┬────────┬────────┬────────┬───┘
       │       │        │        │        │
       ▼       ▼        ▼        ▼        ▼
   ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐
   │User│  │Cat │  │Book│  │Pay │  │Int │
   │Svc │  │Svc │  │Svc │  │Svc │  │Svc │
   └─┬──┘  └─┬──┘  └─┬──┘  └─┬──┘  └─┬──┘
     │       │       │       │       │
     ▼       ▼       ▼       ▼       ▼
   ┌─────────────────────────────────────┐
   │         PostgreSQL (9 DBs)          │
   └─────────────────────────────────────┘

   ┌─────────────────────────────────────┐
   │  Kafka (Event Bus)                  │
   │  - booking.created                  │
   │  - payment.succeeded                │
   │  - receipt.generated                │
   └─────────────────────────────────────┘
```

---

## 🔄 Event Flow Example

**User Creates Booking:**

1. Frontend → API Gateway → Booking Service
2. Booking Service:
   - Saves to database (status: PENDING)
   - Emits `booking.created` to Kafka

3. Payment Service (listens to Kafka):
   - Receives `booking.created`
   - Creates Stripe PaymentIntent
   - Returns client_secret to frontend

4. User completes payment via Stripe

5. Stripe webhook → Payment Service:
   - Verifies signature
   - Updates payment status
   - Emits `payment.succeeded`

6. Booking Service (listens to Kafka):
   - Receives `payment.succeeded`
   - Updates booking status to CONFIRMED

7. Receipt Service (listens to Kafka):
   - Receives `payment.succeeded`
   - Generates PDF receipt
   - Stores in MinIO (S3)
   - Emits `receipt.generated`

8. Notification Service (listens to Kafka):
   - Receives `receipt.generated`
   - Sends email with receipt

9. Integration Service (listens to Kafka):
   - Receives `payment.succeeded`
   - Sends conversion event to TikTok
   - Tracks attribution

---

## 🔧 Configuration

Each service has `.env` file:

### Example: `services/booking-service/.env`
```
PORT=3003
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/booking_db
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

### TikTok Configuration: `services/integration-service/.env`
```
TIKTOK_PIXEL_ID=your_pixel_id
TIKTOK_ACCESS_TOKEN=your_access_token
TIKTOK_EVENT_API_URL=https://business-api.tiktok.com/open_api/v1.3/event/track/
```

---

## 📈 Monitoring

View real-time metrics:
- **Service Health**: http://localhost:8080/health
- **Kafka Topics**: 
  ```bash
  docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
  ```
- **Database Status**:
  ```bash
  psql -U postgres -h localhost -c "SELECT datname FROM pg_database;"
  ```

---

## 🧪 Testing

### Test Booking Flow
```bash
# Create booking
curl -X POST http://localhost:8080/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": "PRODUCT_ID",
    "quantity": 1,
    "start_time": "2025-12-01T14:00:00Z"
  }'
```

### Test TikTok Event
```bash
# Check Integration Service logs
docker logs integration-service

# You should see:
# ✅ TikTok event sent: CompletePayment
# Event ID: abc123
# Value: $99.99
```

---

## 🐛 Troubleshooting

### Services not starting?
```bash
# Check if ports are available
lsof -i :8080  # API Gateway
lsof -i :3003  # Booking Service
lsof -i :9092  # Kafka
```

### Kafka connection issues?
```bash
# Restart Kafka
docker-compose restart kafka

# Check Kafka is healthy
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### Database connection errors?
```bash
# Verify databases exist
psql -U postgres -h localhost -l

# Check connections
psql -U postgres -h localhost -d booking_db -c "SELECT 1;"
```

---

## 📚 Documentation

- **API Docs**: Each service has OpenAPI spec at `/docs`
- **Architecture**: See `/docs/architecture.md`
- **Event Specs**: See `/docs/events.md`
- **Deployment**: See `/docs/deployment.md`

---

## 🎉 Success Checklist

- [x] Infrastructure running (docker-compose ps shows all green)
- [x] All 9 services started
- [x] Frontend accessible at localhost:3000
- [x] Can browse products
- [x] Can create bookings
- [x] Payments process through Stripe
- [x] TikTok events tracked
- [x] Admin dashboard works

---

**You now have a complete, production-ready microservices platform! 🚀**

Next steps:
1. Configure Stripe API keys
2. Set up TikTok pixel ID
3. Configure Google Maps API key
4. Deploy to Kubernetes
