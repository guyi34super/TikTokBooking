# 🚀 Complete Setup Guide - Step by Step

Follow these steps to get your order tracking system running.

## Prerequisites

Install these first:
- **Node.js** 18+ (https://nodejs.org)
- **PostgreSQL** 14+ (https://www.postgresql.org/download/)
- **npm** or **yarn**

## Step 1: Set Up Database (5 minutes)

### 1.1 Create Database

```bash
# Open terminal and create database
createdb order_system

# Or if you need to use psql:
psql -U postgres
CREATE DATABASE order_system;
\q
```

### 1.2 Run Migrations

```bash
# Navigate to project root
cd /workspace

# Run each migration in order
psql -d order_system -f database/001_create_products_table.sql
psql -d order_system -f database/002_create_orders_table.sql
psql -d order_system -f database/003_create_users_table.sql
```

### 1.3 Add Sample Data

```bash
psql -d order_system << 'EOF'
-- Add sample products
INSERT INTO products (name, description, type, price, category, in_stock) VALUES
  ('Website Development', 'Full-stack web development service', 'service', 2500.00, 'development', true),
  ('Logo Design', 'Professional logo design service', 'service', 300.00, 'design', true),
  ('SEO Optimization', 'Search engine optimization', 'service', 500.00, 'marketing', true),
  ('MacBook Pro', 'High-performance laptop', 'product', 2399.00, 'electronics', true),
  ('Desk Chair', 'Ergonomic office chair', 'product', 450.00, 'furniture', true),
  ('Wireless Mouse', 'Bluetooth mouse', 'product', 29.99, 'accessories', true);

-- Add a test user
INSERT INTO users (email, name, password_hash, role) VALUES
  ('admin@test.com', 'Admin User', 'hashed_password_here', 'admin'),
  ('user@test.com', 'Test User', 'hashed_password_here', 'user');
EOF
```

Verify it worked:
```bash
psql -d order_system -c "SELECT name, type, price FROM products;"
```

## Step 2: Set Up Backend (10 minutes)

### 2.1 Create Backend Directory

```bash
mkdir -p backend
cd backend
npm init -y
```

### 2.2 Install Dependencies

```bash
npm install express pg cors dotenv
npm install --save-dev nodemon
```

### 2.3 Create Server File

Create `backend/server.js`:

```javascript
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/order_system'
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth middleware (replace with real JWT in production)
const authenticateUser = (req, res, next) => {
  // For now, just use a hardcoded user ID
  // In production, verify JWT token here
  req.user = { id: '123e4567-e89b-12d3-a456-426614174000', role: 'user' };
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================================================
// PRODUCTS ENDPOINTS
// ============================================================================

// GET /v1/products - List all products
app.get('/v1/products', async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /v1/products/:id - Get product details
app.get('/v1/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ============================================================================
// ORDERS ENDPOINTS
// ============================================================================

// POST /v1/orders - Create new order
app.post('/v1/orders', authenticateUser, async (req, res) => {
  try {
    const { items, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    
    // Calculate total from items
    let total = 0;
    const enrichedItems = [];
    
    for (const item of items) {
      const productResult = await pool.query(
        'SELECT id, name, price FROM products WHERE id = $1',
        [item.product_id]
      );
      
      if (productResult.rows.length === 0) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }
      
      const product = productResult.rows[0];
      const itemTotal = product.price * item.quantity;
      total += itemTotal;
      
      enrichedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: parseFloat(product.price)
      });
    }
    
    // Create order
    const result = await pool.query(
      `INSERT INTO orders (user_id, items, total_amount, status, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, JSON.stringify(enrichedItems), total, 'pending', 'pending', notes]
    );
    
    const order = result.rows[0];
    console.log('Order created:', order.id);
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /v1/orders - Get my orders
app.get('/v1/orders', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /v1/orders/:id - Get order details
app.get('/v1/orders/:id', authenticateUser, async (req, res) => {
  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [req.params.id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Get status history
    const historyResult = await pool.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC',
      [order.id]
    );
    
    order.tracking_info = {
      status_history: historyResult.rows.map(h => ({
        status: h.status,
        timestamp: h.created_at,
        note: h.note
      }))
    };
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /v1/orders/:id/payment-status - Check payment status
app.get('/v1/orders/:id/payment-status', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, payment_status, paid_at, total_amount, currency FROM orders WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = result.rows[0];
    res.json({
      order_id: order.id,
      payment_status: order.payment_status,
      paid_at: order.paid_at,
      amount: parseFloat(order.total_amount),
      currency: order.currency
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// GET /v1/admin/orders - Get all orders
app.get('/v1/admin/orders', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status, payment_status } = req.query;
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    
    if (payment_status) {
      params.push(payment_status);
      query += ` AND payment_status = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /v1/admin/orders/:id/mark-paid - Mark order as paid
app.post('/v1/admin/orders/:id/mark-paid', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE orders SET payment_status = $1, paid_at = NOW() WHERE id = $2 RETURNING *',
      ['paid', req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log('Order marked as paid:', req.params.id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({ error: 'Failed to mark order as paid' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`📋 API available at http://localhost:${port}/v1`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});
```

### 2.4 Create Environment File

Create `backend/.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_system
PORT=8080
```

### 2.5 Update package.json

Edit `backend/package.json` to add start script:

```json
{
  "name": "order-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2.6 Start Backend

```bash
npm run dev
```

You should see:
```
✅ Server running on http://localhost:8080
📋 API available at http://localhost:8080/v1
🏥 Health check: http://localhost:8080/health
```

### 2.7 Test Backend

Open a new terminal and test:

```bash
# Get all products
curl http://localhost:8080/v1/products

# Health check
curl http://localhost:8080/health
```

## Step 3: Set Up Frontend (10 minutes)

### 3.1 Create React App

```bash
cd /workspace
npx create-react-app frontend --template typescript
cd frontend
```

### 3.2 Install Dependencies

```bash
npm install @tanstack/react-query axios
npm install -D @types/node
```

### 3.3 Copy Components

The components are already in `/workspace/frontend/src/components/`, so just make sure they're there:

```bash
# Create directories if needed
mkdir -p src/components
mkdir -p src/services

# Components should already be at:
# src/components/ProductList.tsx
# src/components/OrderTracker.tsx
# src/components/AdminDashboard.tsx
# src/services/api.ts
```

### 3.4 Create App.tsx

Create `frontend/src/App.tsx`:

```typescript
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductList } from './components/ProductList';
import { OrderTracker } from './components/OrderTracker';
import { AdminDashboard } from './components/AdminDashboard';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [view, setView] = useState<'products' | 'orders' | 'admin'>('products');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {/* Navigation */}
        <nav style={{ 
          padding: '1rem', 
          background: '#333', 
          color: 'white',
          display: 'flex',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0, flex: 1 }}>Order System</h2>
          <button 
            onClick={() => setView('products')}
            style={{ 
              padding: '0.5rem 1rem',
              background: view === 'products' ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Products
          </button>
          <button 
            onClick={() => setView('orders')}
            style={{ 
              padding: '0.5rem 1rem',
              background: view === 'orders' ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            My Orders
          </button>
          <button 
            onClick={() => setView('admin')}
            style={{ 
              padding: '0.5rem 1rem',
              background: view === 'admin' ? '#4CAF50' : '#666',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Admin
          </button>
        </nav>

        {/* Content */}
        {view === 'products' && <ProductList />}
        {view === 'orders' && <OrderTracker />}
        {view === 'admin' && <AdminDashboard />}
      </div>
    </QueryClientProvider>
  );
}

export default App;
```

### 3.5 Update API URL

Edit `frontend/src/services/api.ts` and update the baseURL:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080/v1',  // Make sure this matches your backend
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 3.6 Start Frontend

```bash
npm start
```

Browser should open at `http://localhost:3000`

## Step 4: Test the System! 🎉

### Test 1: Browse Products
1. Open `http://localhost:3000`
2. You should see 6 products (3 services, 3 products)
3. Filter by "Products" or "Services"

### Test 2: Create Order
1. Click "Add to Cart" on any product
2. Adjust quantity with +/- buttons
3. Click "Proceed to Checkout" (for now, this will just navigate)

To actually create an order, use the API directly:

```bash
curl -X POST http://localhost:8080/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "PASTE_PRODUCT_ID_HERE",
        "quantity": 1
      }
    ],
    "notes": "Test order"
  }'
```

### Test 3: View Orders
1. Click "My Orders" in navigation
2. You'll see your order with payment status "pending"

### Test 4: Check Payment Status

```bash
# Get order ID from previous step, then:
curl http://localhost:8080/v1/orders/YOUR_ORDER_ID/payment-status
```

### Test 5: Admin Dashboard
1. Click "Admin" in navigation
2. See all orders
3. Click "Mark Paid" on pending orders
4. Watch payment status change to "paid"

## Step 5: Quick Commands Reference

```bash
# Start backend
cd /workspace/backend
npm run dev

# Start frontend (in new terminal)
cd /workspace/frontend
npm start

# Check database
psql -d order_system -c "SELECT * FROM orders;"
psql -d order_system -c "SELECT * FROM products;"

# View order status history
psql -d order_system -c "SELECT * FROM order_status_history;"
```

## Troubleshooting

### Database connection error?
```bash
# Check PostgreSQL is running
psql --version
psql -U postgres -l

# Update backend/.env with correct credentials
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/order_system
```

### Port already in use?
```bash
# Change port in backend/.env
PORT=3001

# Or kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Frontend can't connect to backend?
- Make sure backend is running on port 8080
- Check `frontend/src/services/api.ts` has correct URL
- Enable CORS (already done in server.js)

### Products not showing?
```bash
# Verify products exist
psql -d order_system -c "SELECT COUNT(*) FROM products;"

# Re-run sample data insert from Step 1.3
```

---

## 🎉 You're Done!

You should now have:
- ✅ Backend API running on `http://localhost:8080`
- ✅ Frontend React app on `http://localhost:3000`
- ✅ Database with sample products
- ✅ Ability to create orders
- ✅ Order tracking with payment status
- ✅ Admin dashboard

Next steps:
- Add real authentication (JWT)
- Integrate Stripe for payments
- Add email notifications
- Deploy to production
