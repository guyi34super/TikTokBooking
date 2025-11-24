const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/order_system'
});

app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /auth/register - Register new user (client or seller)
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, user_type, business_name, description, category } = req.body;

    // Validate input
    if (!email || !password || !name || !user_type) {
      return res.status(400).json({ error: 'Email, password, name, and user_type are required' });
    }

    if (!['client', 'seller'].includes(user_type)) {
      return res.status(400).json({ error: 'user_type must be either "client" or "seller"' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, user_type, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, user_type, created_at`,
      [email, password_hash, name, user_type, true, true]
    );

    const user = userResult.rows[0];

    // If seller, create seller profile
    if (user_type === 'seller') {
      await pool.query(
        `INSERT INTO seller_profiles (user_id, business_name, description, category, verification_status)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, business_name || name, description || '', category || 'General', 'pending']
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /auth/login - Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, name, user_type, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        user_type: user.user_type
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET /auth/me - Get current user info
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.user_type, u.phone, u.profile_image, u.created_at,
              sp.business_name, sp.description, sp.category, sp.rating, sp.total_sales, sp.verification_status
       FROM users u
       LEFT JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// GET /sellers - Get all verified sellers
app.get('/sellers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, sp.business_name, sp.description, sp.category, 
              sp.rating, sp.total_sales, sp.verification_status
       FROM users u
       INNER JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE u.user_type = 'seller' AND sp.verification_status = 'verified'
       ORDER BY sp.rating DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get sellers' });
  }
});

// GET /sellers/:id - Get seller details
app.get('/sellers/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, sp.business_name, sp.description, sp.category, 
              sp.rating, sp.total_sales, sp.verification_status, sp.created_at
       FROM users u
       INNER JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE u.id = $1 AND u.user_type = 'seller'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get seller' });
  }
});

// GET /sellers/:id/products - Get products by seller
app.get('/sellers/:id/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE seller_id = $1 AND is_approved = true ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get seller products' });
  }
});

// PUT /sellers/profile - Update seller profile (authenticated)
app.put('/sellers/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can update seller profile' });
    }

    const { business_name, description, category, bank_account } = req.body;

    const result = await pool.query(
      `UPDATE seller_profiles 
       SET business_name = COALESCE($1, business_name),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           bank_account = COALESCE($4, bank_account)
       WHERE user_id = $5
       RETURNING *`,
      [business_name, description, category, bank_account, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /clients - Get all clients (admin only)
app.get('/clients', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      `SELECT id, email, name, phone, created_at
       FROM users
       WHERE user_type = 'client'
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get clients' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

app.listen(PORT, () => {
  console.log(`✅ USER SERVICE running on port ${PORT}`);
  console.log(`   Supports: Clients, Sellers, Authentication`);
});
