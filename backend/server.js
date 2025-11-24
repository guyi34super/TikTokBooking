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

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth middleware (replace with real JWT in production)
const authenticateUser = (req, res, next) => {
  // For demo purposes, use a fixed user ID
  // In production, verify JWT token here
  const token = req.headers.authorization;
  
  if (token && token.includes('admin')) {
    req.user = { id: 'admin-user-id', role: 'admin' };
  } else {
    req.user = { id: 'test-user-id', role: 'user' };
  }
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
      const itemTotal = parseFloat(product.price) * item.quantity;
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
    console.log('✅ Order created:', order.id);
    
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
    
    console.log('✅ Order marked as paid:', req.params.id);
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
  console.log('================================================');
  console.log('✅ Backend Server Started!');
  console.log('================================================');
  console.log(`🌐 Server: http://localhost:${port}`);
  console.log(`📋 API: http://localhost:${port}/v1`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
  console.log('================================================');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  pool.end(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});
