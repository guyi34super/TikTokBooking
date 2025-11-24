const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date() });
});

// Proxy routes
app.use('/auth', createProxyMiddleware({ 
  target: SERVICES.user, 
  pathRewrite: { '^/auth': '/auth' },
  changeOrigin: true 
}));

app.use('/users', createProxyMiddleware({ 
  target: SERVICES.user, 
  changeOrigin: true 
}));

app.use('/sellers', createProxyMiddleware({ 
  target: SERVICES.user, 
  pathRewrite: { '^/sellers': '/sellers' },
  changeOrigin: true 
}));

app.use('/clients', createProxyMiddleware({ 
  target: SERVICES.user, 
  pathRewrite: { '^/clients': '/clients' },
  changeOrigin: true 
}));

app.use('/products', createProxyMiddleware({ 
  target: SERVICES.catalog, 
  pathRewrite: { '^/products': '/products' },
  changeOrigin: true 
}));

app.use('/bookings', createProxyMiddleware({ 
  target: SERVICES.booking,
  pathRewrite: { '^/bookings': '/bookings' },
  changeOrigin: true 
}));

app.use('/payments', createProxyMiddleware({ 
  target: SERVICES.payment,
  pathRewrite: { '^/payments': '/payments' },
  changeOrigin: true 
}));

app.use('/admin', createProxyMiddleware({ 
  target: SERVICES.booking,
  pathRewrite: { '^/admin': '/admin' },
  changeOrigin: true 
}));

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`✅ API GATEWAY running on port ${PORT}`);
  console.log('='.repeat(50));
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
  console.log('Routing to services:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`  📍 ${name}: ${url}`);
  });
  console.log('='.repeat(50));
  console.log('Available routes:');
  console.log('  🔐 /auth/* - User authentication');
  console.log('  👥 /sellers/* - Seller management');
  console.log('  👤 /clients/* - Client management');
  console.log('  📦 /products/* - Product catalog');
  console.log('  📋 /bookings/* - Order management');
  console.log('  💳 /payments/* - Payment processing');
  console.log('  👨‍💼 /admin/* - Admin functions');
  console.log('='.repeat(50));
});
