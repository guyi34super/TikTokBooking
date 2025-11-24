# Booking App Implementation Guide

This guide walks you through implementing the scalable microservices booking application from the blueprint.

## 📁 Project Structure

```
/workspace
├── api-specs/                    # OpenAPI specifications
│   ├── booking-service-openapi.yaml
│   ├── payment-service-openapi.yaml
│   ├── user-service-openapi.yaml
│   └── catalog-service-openapi.yaml
├── database/
│   └── migrations/              # SQL migration scripts
│       ├── booking-service/
│       ├── payment-service/
│       ├── user-service/
│       ├── receipt-service/
│       └── catalog-service/
├── events/                      # Kafka events and consumers
│   ├── kafka-topics.md         # Topic documentation
│   ├── consumers/              # Consumer implementations
│   ├── producers/              # Producer implementations
│   └── types/                  # TypeScript event types
├── frontend/                    # React application
│   └── src/
│       ├── components/
│       │   ├── booking/
│       │   ├── payments/
│       │   └── maps/
│       ├── services/
│       └── hooks/
└── backend/                     # Microservices (to be implemented)
    ├── booking-service/
    ├── payment-service/
    ├── user-service/
    ├── catalog-service/
    ├── receipt-service/
    └── notification-service/
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Go** 1.21+ or **Java** 17+ (choose your backend language)
- **PostgreSQL** 14+
- **Redis** 7+
- **Kafka** 3.5+ (or managed Kafka like Confluent Cloud)
- **Docker** & **Docker Compose** (for local development)
- **Kubernetes** cluster (for deployment)

### Step 1: Set Up Local Infrastructure

Create a `docker-compose.yml` for local development:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  postgres_data:
```

Start infrastructure:
```bash
docker-compose up -d
```

### Step 2: Initialize Databases

For each service, create a database and run migrations:

```bash
# Create databases
psql -U postgres -c "CREATE DATABASE booking_service;"
psql -U postgres -c "CREATE DATABASE payment_service;"
psql -U postgres -c "CREATE DATABASE user_service;"
psql -U postgres -c "CREATE DATABASE catalog_service;"
psql -U postgres -c "CREATE DATABASE receipt_service;"

# Run migrations
psql -U postgres -d booking_service -f database/migrations/booking-service/001_create_bookings_table.sql
psql -U postgres -d booking_service -f database/migrations/booking-service/002_create_locations_table.sql
# ... repeat for other services
```

### Step 3: Set Up Kafka Topics

```bash
# Create topics
kafka-topics --create --topic booking.booking.created --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic booking.booking.confirmed --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
kafka-topics --create --topic payment.payment.succeeded --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
# ... create other topics from events/kafka-topics.md
```

### Step 4: Implement Backend Services

Choose your backend framework:

#### Option A: Node.js with NestJS

```bash
cd backend
npm install -g @nestjs/cli

# Create services
nest new booking-service
nest new payment-service
nest new user-service
# ... etc
```

#### Option B: Go with Gin/Echo

```bash
cd backend
mkdir booking-service && cd booking-service
go mod init booking-service
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u github.com/segmentio/kafka-go
```

#### Option C: Java with Spring Boot

```bash
cd backend
spring init --dependencies=web,data-jpa,kafka,redis booking-service
spring init --dependencies=web,data-jpa,kafka,redis payment-service
# ... etc
```

### Step 5: Implement Core Endpoints

Use the OpenAPI specs in `api-specs/` as your contract. Key endpoints to implement:

**Booking Service** (`booking-service-openapi.yaml`):
- `POST /bookings` - Create booking
- `GET /bookings/{id}` - Get booking
- `POST /bookings/{id}/cancel` - Cancel booking
- `POST /bookings/{id}/confirm` - Confirm booking

**Payment Service** (`payment-service-openapi.yaml`):
- `POST /payments/create` - Create payment intent
- `GET /payments/{id}` - Get payment
- `POST /webhooks/stripe` - Handle Stripe webhooks

**Catalog Service** (`catalog-service-openapi.yaml`):
- `GET /products` - List products
- `GET /products/{id}` - Get product details

**User Service** (`user-service-openapi.yaml`):
- `POST /users` - Create user
- `GET /users/{id}` - Get user profile
- `PUT /users/{id}` - Update user

### Step 6: Implement Kafka Producers

In your booking service, emit events after operations:

```typescript
// Example: After creating a booking
import { publishBookingCreated } from '../events/producers/booking-producer';

async createBooking(data: BookingCreateRequest) {
  // 1. Insert into database
  const booking = await this.bookingRepository.save(data);
  
  // 2. Emit event
  await publishBookingCreated({
    bookingId: booking.id,
    userId: booking.user_id,
    productId: booking.product_id,
    // ... other fields
  });
  
  return booking;
}
```

### Step 7: Implement Kafka Consumers

Run consumers as separate processes or within services:

```bash
# In payment-service
npm run consumer:payment

# In notification-service
npm run consumer:notification
```

Reference implementations are in `events/consumers/`.

### Step 8: Set Up Frontend

```bash
cd frontend
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API URL, Stripe key, Google Maps key

# Start development server
npm run dev
```

### Step 9: Integrate Stripe

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the dashboard
3. Add webhook endpoint in Stripe dashboard:
   - URL: `https://your-api.com/payment/v1/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy webhook secret to your `.env` file

### Step 10: Integrate Google Maps

1. Create a Google Cloud project
2. Enable Google Maps JavaScript API and Places API
3. Create an API key with restrictions
4. Add to frontend `.env` file

### Step 11: Set Up Authentication

Choose one:

**Option A: Use Keycloak (self-hosted)**
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

**Option B: Use Auth0 (managed)**
1. Create Auth0 account
2. Create application
3. Configure social connections (Google, Apple)
4. Update service URLs

**Option C: Build custom auth service**
- Use `user-service-openapi.yaml` as guide
- Implement JWT issuance and validation
- Add OAuth2 flows for social login

### Step 12: Deploy to Kubernetes

```bash
# Create Kubernetes manifests
kubectl create namespace booking-app

# Deploy services
kubectl apply -f k8s/booking-service.yaml
kubectl apply -f k8s/payment-service.yaml
# ... etc

# Set up ingress
kubectl apply -f k8s/ingress.yaml
```

## 🔐 Security Checklist

- [ ] Enable HTTPS/TLS for all services
- [ ] Store secrets in Vault or cloud secret manager
- [ ] Validate JWT tokens in all protected endpoints
- [ ] Verify Stripe webhook signatures
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Enable SQL injection protection (use ORMs/prepared statements)
- [ ] Implement RBAC (roles: user, provider, admin)
- [ ] Add request logging with trace IDs
- [ ] Sanitize user inputs

## 📊 Monitoring Setup

1. **Prometheus + Grafana**
   - Scrape metrics from `/metrics` endpoint
   - Create dashboards for each service

2. **Jaeger (Distributed Tracing)**
   - Add OpenTelemetry instrumentation
   - Track request flow across services

3. **ELK Stack (Logging)**
   - Ship logs to Elasticsearch
   - Create Kibana dashboards

4. **Alerts**
   - High error rate
   - Consumer lag > 1000
   - Database connection pool exhausted
   - Payment failure rate > 5%

## 🧪 Testing

### Unit Tests
```bash
# Backend (example with Jest/Vitest)
npm test

# Frontend
cd frontend && npm test
```

### Integration Tests
```bash
# Test service-to-service communication
npm run test:integration
```

### E2E Tests
```bash
# Frontend E2E with Cypress
cd frontend && npm run test:e2e
```

### Load Tests
```bash
# Using k6
k6 run load-tests/booking-flow.js
```

## 📦 CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: Deploy Booking Service

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -t booking-service:${{ github.sha }} .
      - name: Push to registry
        run: docker push booking-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/booking-service \
            booking-service=booking-service:${{ github.sha }}
```

## 🎯 Next Steps

1. **Week 1-2**: Set up infrastructure and implement core booking flow
2. **Week 3-4**: Implement payment integration and event system
3. **Week 5-6**: Build frontend components and integrate APIs
4. **Week 7-8**: Add Google Maps and social auth
5. **Week 9-10**: Testing, monitoring, and hardening
6. **Week 11-12**: Production deployment and launch

## 📚 Additional Resources

- OpenAPI Specs: See `api-specs/` directory
- Database Schemas: See `database/migrations/` directory
- Event Definitions: See `events/kafka-topics.md`
- Frontend Components: See `frontend/src/components/`

## 💡 Tips

- Start with booking + payment flow (MVP)
- Use feature flags for new features
- Implement circuit breakers for service-to-service calls
- Cache heavily-read data in Redis
- Use database read replicas for reporting
- Set up staging environment early

## 🐛 Troubleshooting

**Kafka consumer not receiving messages?**
- Check topic exists: `kafka-topics --list --bootstrap-server localhost:9092`
- Check consumer group lag: `kafka-consumer-groups --describe --group payment-service-group`

**Payment webhook not firing?**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:8081/webhooks/stripe`

**Database connection issues?**
- Check connection pool settings
- Verify network accessibility
- Check credentials in environment variables

## 📞 Support

For questions or issues, refer to the blueprint documentation or create an issue in the repository.

---

**Ready to build?** Start with Step 1 and work your way through. Good luck! 🚀
