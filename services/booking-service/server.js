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

// POST /bookings - Create booking
app.post('/bookings', async (req, res) => {
  try {
    const { items } = req.body;
    let total = 0;
    const enrichedItems = [];
    
    for (const item of items) {
      const productResult = await pool.query('SELECT id, name, price FROM products WHERE id = $1', [item.product_id]);
      if (productResult.rows.length === 0) {
        return res.status(400).json({ error: `Product ${item.product_id} not found` });
      }
      const product = productResult.rows[0];
      total += parseFloat(product.price) * item.quantity;
      enrichedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: parseFloat(product.price)
      });
    }
    
    const result = await pool.query(
      `INSERT INTO orders (user_id, items, total_amount, status, payment_status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['test-user-id', JSON.stringify(enrichedItems), total, 'pending', 'pending']
    );
    
    const booking = result.rows[0];
    
    // Emit Kafka event
    try {
      await producer.connect();
      await producer.send({
        topic: 'booking.created',
        messages: [{
          key: booking.id,
          value: JSON.stringify({
            booking_id: booking.id,
            total_amount: booking.total_amount,
            items: enrichedItems
          })
        }]
      });
      console.log('✅ Emitted booking.created event');
    } catch (kafkaError) {
      console.log('⚠️ Kafka not available, continuing...');
    }
    
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /bookings
app.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id
app.get('/bookings/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// GET /admin/orders
app.get('/admin/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /admin/orders/:id/mark-paid
app.post('/admin/orders/:id/mark-paid', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE orders SET payment_status = $1, paid_at = NOW() WHERE id = $2 RETURNING *',
      ['paid', req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as paid' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ BOOKING SERVICE running on port ${PORT}`);
});
