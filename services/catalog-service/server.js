const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/order_system'
});

app.use(cors());
app.use(express.json());

// Middleware to extract user from headers (optional for some routes)
const getUserFromHeaders = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userType = req.headers['x-user-type'];
  
  if (userId) {
    req.user = {
      id: parseInt(userId),
      email: userEmail,
      user_type: userType
    };
  }
  
  next();
};

// GET /products - Get all products (AUTH REQUIRED via gateway)
app.get('/products', getUserFromHeaders, async (req, res) => {
  try {
    const { type, search, seller_id } = req.query;
    let query = `
      SELECT p.*, u.name as seller_name, sp.business_name, sp.rating
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN seller_profiles sp ON u.id = sp.user_id
      WHERE p.is_approved = true
    `;
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND p.type = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND p.name ILIKE $${params.length}`;
    }
    
    if (seller_id) {
      params.push(seller_id);
      query += ` AND p.seller_id = $${params.length}`;
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const result = await pool.query(query, params);
    
    console.log(`📦 User ${req.user?.email || 'anonymous'} browsing products`);
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /products/:id - Get product details (AUTH REQUIRED via gateway)
app.get('/products/:id', getUserFromHeaders, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.name as seller_name, u.email as seller_email,
             sp.business_name, sp.description as seller_description, 
             sp.rating, sp.total_sales
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      LEFT JOIN seller_profiles sp ON u.id = sp.user_id
      WHERE p.id = $1 AND p.is_approved = true
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log(`📦 User ${req.user?.email || 'anonymous'} viewing product ${req.params.id}`);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /products - Create product (SELLER ONLY)
app.post('/products', getUserFromHeaders, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.user_type !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can create products' });
    }
    
    const { name, type, price, in_stock, description } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products (name, type, price, in_stock, seller_id, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, price, in_stock !== false, req.user.id, false] // Requires approval
    );
    
    res.status(201).json({
      ...result.rows[0],
      message: 'Product created. Pending admin approval.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ CATALOG SERVICE running on port ${PORT}`);
  console.log(`   🔐 Product access requires authentication`);
});
