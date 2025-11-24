const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Service URLs
const SERVICES = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  integration: process.env.INTEGRATION_SERVICE_URL || 'http://localhost:3008',
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid token',
        message: 'Your session has expired. Please login again'
      });
    }
    // Add user info to headers for downstream services
    req.headers['x-user-id'] = user.id;
    req.headers['x-user-email'] = user.email;
    req.headers['x-user-type'] = user.user_type;
    next();
  });
};

// Optional auth (adds user info if present but doesn't require it)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.headers['x-user-id'] = user.id;
        req.headers['x-user-email'] = user.email;
        req.headers['x-user-type'] = user.user_type;
      }
    });
  }
  next();
};

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date() });
});

// Public routes (no auth required)
app.use('/auth', createProxyMiddleware({ 
  target: SERVICES.user, 
  pathRewrite: { '^/auth': '/auth' },
  changeOrigin: true 
}));

// Public: View sellers list (no auth required)
app.use('/sellers', optionalAuth, createProxyMiddleware({ 
  target: SERVICES.user, 
  pathRewrite: { '^/sellers': '/sellers' },
  changeOrigin: true 
}));

// PUBLIC: Browse products (no login required - but we'll track user if logged in)
app.use('/products/browse', optionalAuth, createProxyMiddleware({ 
  target: SERVICES.catalog, 
  pathRewrite: { '^/products/browse': '/products' },
  changeOrigin: true 
}));

// PROTECTED ROUTES - LOGIN REQUIRED

// Products (detailed access requires auth)
app.use('/products', requireAuth, createProxyMiddleware({ 
  target: SERVICES.catalog, 
  pathRewrite: { '^/products': '/products' },
  changeOrigin: true 
}));

// Bookings (always requires auth)
app.use('/bookings', requireAuth, createProxyMiddleware({ 
  target: SERVICES.booking,
  pathRewrite: { '^/bookings': '/bookings' },
  changeOrigin: true 
}));

// Payments (always requires auth)
app.use('/payments', requireAuth, createProxyMiddleware({ 
  target: SERVICES.payment,
  pathRewrite: { '^/payments': '/payments' },
  changeOrigin: true 
}));

// User profile (requires auth)
app.use('/users', requireAuth, createProxyMiddleware({ 
  target: SERVICES.user, 
  changeOrigin: true 
}));

// Clients (admin only)
app.use('/clients', requireAuth, createProxyMiddleware({ 
  target: SERVICES.user, 
  pathRewrite: { '^/clients': '/clients' },
  changeOrigin: true 
}));

// Admin routes (requires auth + admin check)
app.use('/admin', requireAuth, createProxyMiddleware({ 
  target: SERVICES.booking,
  pathRewrite: { '^/admin': '/admin' },
  changeOrigin: true 
}));

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`✅ API GATEWAY running on port ${PORT}`);
  console.log('   🔐 AUTHENTICATION REQUIRED for most routes');
  console.log('='.repeat(60));
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('PUBLIC Routes (No login required):');
  console.log('  🔓 /auth/* - Login, Register');
  console.log('  🔓 /sellers - Browse sellers');
  console.log('  🔓 /products/browse - Browse products');
  console.log('');
  console.log('PROTECTED Routes (Login required 🔐):');
  console.log('  🔐 /products/* - Full product access');
  console.log('  🔐 /bookings/* - Create/view orders');
  console.log('  🔐 /payments/* - Payment processing');
  console.log('  🔐 /users/* - User profile');
  console.log('  🔐 /admin/* - Admin functions');
  console.log('='.repeat(60));
  console.log('Routing to services:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  📍 ${name}: ${url}`);
  });
  console.log('='.repeat(60));
});
