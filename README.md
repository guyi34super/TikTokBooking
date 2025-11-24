# 🚀 Microservices Booking Platform - Complete Implementation

A production-ready, scalable microservices platform for booking products and services with TikTok integration, payments, and real-time tracking.

## 🏗️ Architecture

### Microservices
- **User Service** (Port 3001) - Authentication, profiles, social login
- **Catalog Service** (Port 3002) - Products/services catalog, inventory
- **Booking Service** (Port 3003) - Core booking logic, reservations
- **Payment Service** (Port 3004) - Stripe/PayPal integration, webhooks
- **Receipt Service** (Port 3005) - PDF generation, S3 storage
- **Notification Service** (Port 3006) - Email/SMS notifications
- **Location Service** (Port 3007) - Google Maps integration
- **Integration Service** (Port 3008) - TikTok analytics & attribution
- **Admin Service** (Port 3009) - Reports, user management
- **API Gateway** (Port 8080) - Single entry point, routing

### Infrastructure
- **PostgreSQL** - Database per service
- **Redis** - Caching, sessions, rate limiting
- **Kafka** - Event streaming between services
- **Frontend** (Port 3000) - React SPA with TypeScript

## 📁 Project Structure

```
/workspace
├── services/
│   ├── user-service/          # User management & auth
│   ├── catalog-service/       # Products & services
│   ├── booking-service/       # Core booking logic
│   ├── payment-service/       # Payment processing
│   ├── receipt-service/       # Receipt generation
│   ├── notification-service/  # Notifications
│   ├── location-service/      # Google Maps
│   ├── integration-service/   # TikTok integration
│   ├── admin-service/         # Admin operations
│   └── api-gateway/           # API Gateway
├── frontend/                  # React application
├── infrastructure/
│   ├── docker-compose.yml     # Local development
│   └── kubernetes/            # K8s manifests
├── database/                  # Database migrations
├── docs/                      # Documentation
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 14+
- Kafka

### 1. Start Infrastructure

```bash
cd infrastructure
docker-compose up -d
```

This starts:
- PostgreSQL (all databases)
- Redis
- Kafka + Zookeeper
- Elasticsearch

### 2. Set Up Databases

```bash
./scripts/setup-databases.sh
```

### 3. Start All Services

```bash
# Terminal 1 - User Service
cd services/user-service && npm install && npm run dev

# Terminal 2 - Catalog Service  
cd services/catalog-service && npm install && npm run dev

# Terminal 3 - Booking Service
cd services/booking-service && npm install && npm run dev

# Terminal 4 - Payment Service
cd services/payment-service && npm install && npm run dev

# Terminal 5 - Integration Service (TikTok)
cd services/integration-service && npm install && npm run dev

# Terminal 6 - API Gateway
cd services/api-gateway && npm install && npm start

# Terminal 7 - Frontend
cd frontend && npm install && npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/docs

## 🔄 Event Flow

```
User creates booking
  ↓
Booking Service → booking.created event
  ↓
Payment Service → Creates Stripe PaymentIntent
  ↓
User pays via Stripe
  ↓
Payment Service → payment.succeeded event
  ↓
├─> Booking Service → Updates status to CONFIRMED
├─> Receipt Service → Generates PDF receipt
├─> Notification Service → Sends confirmation email
└─> Integration Service → Sends event to TikTok
```

## 📊 Key Features

### ✅ Booking Management
- Create bookings for products/services
- Real-time availability checking
- Optimistic locking for concurrency
- Status tracking (PENDING → CONFIRMED → COMPLETED)

### ✅ Payment Processing
- Stripe integration (cards, Apple Pay, Google Pay)
- Secure webhook handling
- PCI-DSS compliant
- Automatic payment status updates

### ✅ TikTok Integration
- Track conversion events
- Attribution data
- Server-to-server events API
- Purchase event forwarding with:
  - Order ID & value
  - User identifiers (hashed)
  - Attribution (UTM params, click_id)

### ✅ User Management
- Email/password authentication
- Social login (Google, Apple)
- JWT tokens
- Role-based access (user, provider, admin)

### ✅ Location Services
- Google Maps integration
- Place autocomplete
- Geocoding/reverse geocoding
- Store provider locations

### ✅ Notifications
- Email notifications (order confirmations, receipts)
- SMS support (Twilio)
- Template-based system

### ✅ Admin Dashboard
- View all bookings
- Revenue analytics
- User management
- Manual payment marking

## 🔐 Security

- JWT authentication on all services
- OAuth2 for social login
- Stripe webhook signature verification
- Rate limiting on API Gateway
- CORS configuration
- Input validation
- SQL injection protection

## 📈 Scalability

- Horizontal scaling of stateless services
- Database per service pattern
- Event-driven architecture
- Redis caching
- Kafka for async processing
- Load balancing via API Gateway

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
cd frontend && npm run test:e2e
```

## 📦 Deployment

### Docker

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
# Deploy to K8s
kubectl apply -f infrastructure/kubernetes/

# Check status
kubectl get pods -n booking-platform
```

## 📚 API Documentation

Each service exposes OpenAPI documentation:

- User Service: http://localhost:3001/docs
- Catalog Service: http://localhost:3002/docs
- Booking Service: http://localhost:3003/docs
- Payment Service: http://localhost:3004/docs
- Integration Service: http://localhost:3008/docs

## 🔧 Configuration

Each service has its own `.env` file:

```bash
# Example: services/booking-service/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/booking_db
KAFKA_BROKERS=localhost:9092
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## 📊 Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **Jaeger**: Distributed tracing
- **ELK Stack**: Logging

Access monitoring:
- Grafana: http://localhost:3030
- Jaeger: http://localhost:16686

## 🎯 TikTok Integration Details

The Integration Service handles:

1. **Client-side tracking**: TikTok Pixel embedded in frontend
2. **Server-side events**: Reliable conversion tracking via Events API

For each completed booking:
```javascript
{
  event: "CompletePayment",
  event_id: "unique-event-id",
  properties: {
    content_type: "product",
    contents: [{ content_id: "product-id", quantity: 1 }],
    value: 99.99,
    currency: "USD"
  },
  user: {
    email: "hashed-email",
    phone: "hashed-phone"
  },
  timestamp: "2025-11-24T10:30:00Z"
}
```

## 🚧 Development

### Adding a New Service

1. Create service directory: `services/my-service/`
2. Add to `docker-compose.yml`
3. Create database migration
4. Add to API Gateway routes
5. Update documentation

### Database Migrations

```bash
# Create migration
npm run migrate:create --name=add_new_field

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down
```

## 📞 Support

- Documentation: `/docs`
- API Specs: `/api-specs`
- Issues: Create GitHub issue

## 📄 License

MIT

---

**Ready for production deployment!** 🎉
