# 🚀 HOW TO RUN - COMPLETE SYSTEM

## ✅ Everything is ready! Just follow these 3 steps:

### Step 1: Set Up Database (2 minutes)

```bash
# Create database
createdb order_system

# Run migrations (from /workspace directory)
psql -d order_system -f database/001_create_products_table.sql
psql -d order_system -f database/002_create_orders_table.sql
psql -d order_system -f database/003_create_users_table.sql

# Add sample products
psql -d order_system << 'EOF'
INSERT INTO products (name, description, type, price, category, in_stock) VALUES
  ('Website Development', 'Full-stack web development service', 'service', 2500.00, 'development', true),
  ('Logo Design', 'Professional logo design service', 'service', 300.00, 'design', true),
  ('SEO Optimization', 'Search engine optimization', 'service', 500.00, 'marketing', true),
  ('MacBook Pro', 'High-performance laptop', 'product', 2399.00, 'electronics', true),
  ('Desk Chair', 'Ergonomic office chair', 'product', 450.00, 'furniture', true),
  ('Wireless Mouse', 'Bluetooth mouse', 'product', 29.99, 'accessories', true);
EOF
```

### Step 2: Start Backend (1 minute)

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✅ Backend Server Started!
🌐 Server: http://localhost:8080
📋 API: http://localhost:8080/v1
```

### Step 3: Start Frontend (1 minute)

Open a NEW terminal:

```bash
cd frontend
npm install
npm run dev
```

Browser will open at: `http://localhost:3000`

---

## 🎉 That's it! The system is running!

### What you can do:

1. **Browse Products** - See all products and services
2. **Add to Cart** - Click "Add to Cart" on any item
3. **Place Order** - Click "Place Order" button
4. **View Orders** - Click "My Orders" tab to see your orders
5. **Check Payment Status** - See if orders are paid/pending
6. **Admin Dashboard** - Toggle "Admin Mode" and click "Admin" tab
7. **Mark as Paid** - As admin, mark pending orders as paid

---

## 🔧 Troubleshooting

### Database connection error?
Edit `backend/.env` and update database credentials:
```
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/order_system
```

### Port already in use?
Kill the process:
```bash
# For port 8080 (backend)
lsof -ti:8080 | xargs kill -9

# For port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Products not showing?
Verify products exist:
```bash
psql -d order_system -c "SELECT * FROM products;"
```

---

## 📚 What You Have

### Backend (`/workspace/backend/`)
- ✅ Complete Express.js server
- ✅ All API endpoints implemented
- ✅ PostgreSQL integration
- ✅ CORS enabled
- ✅ Ready to run

### Frontend (`/workspace/frontend/`)
- ✅ Complete React app with Vite
- ✅ TypeScript
- ✅ 3 full components (Products, Orders, Admin)
- ✅ TanStack Query for data fetching
- ✅ Beautiful UI
- ✅ Ready to run

### Database (`/workspace/database/`)
- ✅ 3 SQL migration files
- ✅ All tables with proper schema
- ✅ Ready to use

---

## 🎯 Quick Test Commands

```bash
# Test backend is running
curl http://localhost:8080/health

# Get all products
curl http://localhost:8080/v1/products

# Check database
psql -d order_system -c "SELECT COUNT(*) FROM products;"
```

---

**Everything is ready! Just run the 3 steps above and you're good to go! 🚀**
