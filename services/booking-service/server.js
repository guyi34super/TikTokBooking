const express = require('express');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/order_system'
});

// Kafka setup
const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});
const producer = kafka.producer();

app.use(cors());
app.use(express.json());

// Middleware to extract user from headers (set by API Gateway)
const getUserFromHeaders = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userType = req.headers['x-user-type'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.user = {
    id: parseInt(userId),
    email: userEmail,
    user_type: userType
  };
  
  next();
};

// POST /bookings - Create booking (REQUIRES AUTH)
app.post('/bookings', getUserFromHeaders, async (req, res) => {
  try {
    const { items } = req.body;
    let total = 0;
    const enrichedItems = [];
    let sellerId = null;
    
    for (const item of items) {
      const productResult = await pool.query(
        'SELECT id, name, price, seller_id FROM products WHERE id = $1', 
        [item.product_id]
      );
      
      if (productResult.rows.length === 0) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }
      
      const product = productResult.rows[0];
      total += parseFloat(product.price) * item.quantity;
      sellerId = product.seller_id; // Track seller
      
      enrichedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: parseFloat(product.price)
      });
    }
    
    // Create order with client_id and seller_id
    const result = await pool.query(
      `INSERT INTO orders (user_id, client_id, seller_id, items, total_amount, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, req.user.id, sellerId, JSON.stringify(enrichedItems), total, 'pending', 'pending']
    );
    
    const booking = result.rows[0];
    
    // Emit Kafka event
    try {
      await producer.connect();
      await producer.send({
        topic: 'booking.created',
        messages: [{
          key: String(booking.id),
          value: JSON.stringify({
            booking_id: booking.id,
            client_id: req.user.id,
            client_email: req.user.email,
            seller_id: sellerId,
            total_amount: booking.total_amount,
            items: enrichedItems
          })
        }]
      });
      console.log(`✅ Emitted booking.created event for user ${req.user.email}`);
    } catch (kafkaError) {
      console.log('⚠️ Kafka not available, continuing...');
    }
    
    res.status(201).json({
      ...booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /bookings - Get user's bookings (REQUIRES AUTH)
app.get('/bookings', getUserFromHeaders, async (req, res) => {
  try {
    let query;
    let params;
    
    // If seller, show their sales; if client, show their purchases
    if (req.user.user_type === 'seller') {
      query = 'SELECT * FROM orders WHERE seller_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    } else {
      query = 'SELECT * FROM orders WHERE client_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id - Get specific booking (REQUIRES AUTH)
app.get('/bookings/:id', getUserFromHeaders, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND (client_id = $2 OR seller_id = $2)',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// GET /admin/orders - Admin only
app.get('/admin/orders', getUserFromHeaders, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await pool.query(`
      SELECT o.*, 
             c.name as client_name, c.email as client_email,
             s.name as seller_name, s.email as seller_email
      FROM orders o
      LEFT JOIN users c ON o.client_id = c.id
      LEFT JOIN users s ON o.seller_id = s.id
      ORDER BY o.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /admin/orders/:id/mark-paid - Admin only
app.post('/admin/orders/:id/mark-paid', getUserFromHeaders, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await pool.query(
      'UPDATE orders SET payment_status = $1, paid_at = NOW() WHERE id = $2 RETURNING *',
      ['paid', req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ BOOKING SERVICE running on port ${PORT}`);
  console.log(`   🔐 All routes require authentication`);
});
