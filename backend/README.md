# Backend API

## Setup

```bash
npm install
```

## Configure

Edit `.env` file with your database credentials:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_system
PORT=8080
```

## Run

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Test

```bash
# Health check
curl http://localhost:8080/health

# Get products
curl http://localhost:8080/v1/products

# Create order
curl -X POST http://localhost:8080/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":"YOUR_PRODUCT_ID","quantity":1}]}'
```

## API Endpoints

- `GET /v1/products` - List products
- `GET /v1/products/:id` - Get product
- `POST /v1/orders` - Create order
- `GET /v1/orders` - Get my orders
- `GET /v1/orders/:id` - Get order details
- `GET /v1/orders/:id/payment-status` - Check payment
- `GET /v1/admin/orders` - Admin: all orders
- `POST /v1/admin/orders/:id/mark-paid` - Admin: mark paid
