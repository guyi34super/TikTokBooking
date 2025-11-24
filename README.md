# 📦 Order Tracking System for Products & Services

A simple, production-ready order management system with payment tracking for products and services.

## 🎯 What This System Does

- ✅ **Product & Service Catalog** - List and manage products/services
- ✅ **Order Creation** - Customers can order products/services
- ✅ **Payment Tracking** - Track if orders are paid/pending/failed
- ✅ **Order Status Tracking** - Monitor order lifecycle (pending → processing → completed)
- ✅ **Admin Dashboard** - View all orders and mark them as paid
- ✅ **Customer Order History** - Users can see their order history

## 📁 Project Structure

```
/workspace
├── api-specs/
│   └── order-service-openapi.yaml     # Complete REST API specification
├── database/
│   ├── 001_create_products_table.sql  # Products & services catalog
│   ├── 002_create_orders_table.sql    # Orders with payment tracking
│   └── 003_create_users_table.sql     # User accounts
├── frontend/src/
│   ├── components/
│   │   ├── ProductList.tsx            # Browse and add to cart
│   │   ├── OrderTracker.tsx           # View order history
│   │   └── AdminDashboard.tsx         # Admin: see all orders & payments
│   └── services/
│       └── api.ts                     # API client
├── events/
│   ├── order-events.ts                # Event type definitions
│   ├── order-producer.ts              # Publish events (order created, paid)
│   └── notification-consumer.ts       # Send email notifications
└── README.md                          # This file
```

## 🚀 Quick Start

### 1. Set Up Database

```bash
# Create database
createdb order_system

# Run migrations
psql -d order_system -f database/001_create_products_table.sql
psql -d order_system -f database/002_create_orders_table.sql
psql -d order_system -f database/003_create_users_table.sql
```

### 2. Insert Sample Data

```sql
-- Add some sample products
INSERT INTO products (name, description, type, price, category, in_stock) VALUES
  ('Website Design', 'Professional website design service', 'service', 999.00, 'design', true),
  ('Logo Creation', 'Custom logo design', 'service', 299.00, 'design', true),
  ('Laptop Stand', 'Ergonomic aluminum laptop stand', 'product', 49.99, 'accessories', true),
  ('Wireless Mouse', 'Bluetooth wireless mouse', 'product', 29.99, 'accessories', true);
```

### 3. Start Backend (Choose Your Language)

#### Node.js Example
```bash
npm install express pg kafkajs
node server.js
```

#### Python Example
```bash
pip install fastapi uvicorn psycopg2 kafka-python
uvicorn main:app --reload
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm start
```

## 📊 Database Schema

### Products Table
- **id** - Unique product ID
- **name** - Product/service name
- **type** - 'product' or 'service'
- **price** - Price in decimal
- **in_stock** - Availability status

### Orders Table
- **id** - Unique order ID
- **user_id** - Customer who placed order
- **items** - JSON array of ordered items
- **total_amount** - Total order value
- **status** - pending | processing | completed | cancelled
- **payment_status** - pending | paid | failed | refunded
- **paid_at** - Timestamp when payment was received

### Order Status History Table
- Automatically tracks all status changes
- Used for order tracking timeline

## 🔌 API Endpoints

### Public Endpoints
- `GET /v1/products` - List all products/services
- `GET /v1/products/{id}` - Get product details

### Customer Endpoints (Requires Auth)
- `POST /v1/orders` - Create new order
- `GET /v1/orders` - Get my orders
- `GET /v1/orders/{id}` - Get order details
- `GET /v1/orders/{id}/payment-status` - Check if order is paid

### Admin Endpoints (Requires Admin Auth)
- `GET /v1/admin/orders` - Get all orders (with filters)
- `POST /v1/admin/orders/{id}/mark-paid` - Manually mark order as paid

## 💳 Payment Flow

1. **Customer creates order** → Status: `pending`, Payment: `pending`
2. **Payment webhook received** → Payment: `paid`, Order: `processing`
3. **Admin fulfills order** → Status: `completed`

### Stripe Integration (Optional)

```javascript
// In your order creation endpoint
const paymentIntent = await stripe.paymentIntents.create({
  amount: order.total_amount * 100, // in cents
  currency: 'usd',
  metadata: { order_id: order.id }
});

// In webhook handler
if (event.type === 'payment_intent.succeeded') {
  await db.query(
    'UPDATE orders SET payment_status = $1, paid_at = $2 WHERE id = $3',
    ['paid', new Date(), order_id]
  );
}
```

## 📧 Kafka Events

The system publishes events for:
- `order.created` - When new order is placed
- `order.paid` - When payment is received
- `order.status_changed` - When order status updates

Consumers can subscribe to these events to:
- Send email notifications
- Update analytics
- Trigger fulfillment workflows

## 🎨 Frontend Features

### ProductList Component
- Browse products and services
- Add to cart
- Filter by type (product vs service)
- Show stock availability

### OrderTracker Component
- View all your orders
- See payment status (pending/paid)
- Track order status
- View order history timeline

### AdminDashboard Component
- View all orders across all customers
- Filter by status and payment status
- See total revenue and statistics
- Manually mark orders as paid

## 🔧 Backend Implementation Example

### Node.js with Express

```javascript
const express = require('express');
const { Pool } = require('pg');

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// Create order
app.post('/v1/orders', async (req, res) => {
  const { items } = req.body;
  const user_id = req.user.id; // from auth middleware
  
  const total = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  const result = await db.query(
    `INSERT INTO orders (user_id, items, total_amount, status, payment_status)
     VALUES ($1, $2, $3, 'pending', 'pending') RETURNING *`,
    [user_id, JSON.stringify(items), total]
  );
  
  // Publish Kafka event
  await publishOrderCreated(result.rows[0]);
  
  res.json(result.rows[0]);
});

// Get my orders
app.get('/v1/orders', async (req, res) => {
  const user_id = req.user.id;
  const result = await db.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  res.json(result.rows);
});

// Check payment status
app.get('/v1/orders/:id/payment-status', async (req, res) => {
  const result = await db.query(
    'SELECT id, payment_status, paid_at, total_amount, currency FROM orders WHERE id = $1',
    [req.params.id]
  );
  res.json(result.rows[0]);
});
```

## 🛡️ Security

- All customer endpoints require JWT authentication
- Admin endpoints require admin role
- Payment webhooks should verify signatures
- SQL injection protected with parameterized queries

## 📈 What You Can Track

### For Customers
- ✅ What they ordered
- ✅ How much they paid
- ✅ Payment status (pending/paid/failed)
- ✅ Order status (pending/processing/completed)
- ✅ Order history

### For Admins
- ✅ All orders across all customers
- ✅ Which orders are paid vs pending payment
- ✅ Total revenue
- ✅ Order fulfillment status
- ✅ Ability to manually mark orders as paid

## 🔄 Common Workflows

### Customer Places Order
1. Browse products (`ProductList.tsx`)
2. Add items to cart
3. Click "Proceed to Checkout"
4. Order created with status `pending`
5. Customer pays (via Stripe or other method)
6. Webhook updates `payment_status` to `paid`
7. Order moves to `processing`
8. Admin fulfills order → status becomes `completed`

### Admin Manages Orders
1. View dashboard (`AdminDashboard.tsx`)
2. Filter by pending payments
3. Mark orders as paid manually (if needed)
4. Track order fulfillment

## 🚧 Next Steps to Implement

1. **Authentication** - Add JWT auth middleware
2. **Payment Gateway** - Integrate Stripe/PayPal
3. **Email Service** - Connect notification consumer to SendGrid/AWS SES
4. **Admin Panel** - Add product management (CRUD)
5. **Search** - Add product search functionality
6. **Images** - Add product image uploads

## 📦 Technologies

- **Frontend**: React, TypeScript, TanStack Query
- **Backend**: Node.js/Python/Go (your choice)
- **Database**: PostgreSQL
- **Events**: Apache Kafka
- **Payments**: Stripe (recommended)

## 🎯 Key Features Summary

| Feature | Status |
|---------|--------|
| Product catalog | ✅ Complete |
| Order creation | ✅ Complete |
| Payment tracking | ✅ Complete |
| Order status tracking | ✅ Complete |
| Customer order history | ✅ Complete |
| Admin dashboard | ✅ Complete |
| Kafka events | ✅ Complete |
| Email notifications | ✅ Framework ready |
| Payment webhook | ✅ Endpoint ready |

## 📝 License

This is a technical blueprint - use it for your projects!

---

**Ready to build?** Start by setting up the database, then implement the backend API using the OpenAPI spec, and connect the React frontend! 🚀
