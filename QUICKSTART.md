# ⚡ Quick Start (5 Minutes)

## Prerequisites
- PostgreSQL installed and running
- Node.js 18+ installed
- npm or yarn

## Option 1: Automated Setup (Fastest)

```bash
cd /workspace
./quick-start.sh
```

Then follow the instructions printed at the end.

## Option 2: Manual Setup

### Step 1: Database (2 min)
```bash
createdb order_system
psql -d order_system -f database/001_create_products_table.sql
psql -d order_system -f database/002_create_orders_table.sql
psql -d order_system -f database/003_create_users_table.sql
```

Add sample data:
```bash
psql -d order_system << 'EOF'
INSERT INTO products (name, type, price, in_stock) VALUES
  ('Website Service', 'service', 2500.00, true),
  ('Logo Design', 'service', 300.00, true),
  ('Laptop', 'product', 1200.00, true);
EOF
```

### Step 2: Backend (2 min)

See `SETUP_GUIDE.md` Step 2 for the complete `backend/server.js` file.

Quick version:
```bash
mkdir backend && cd backend
npm init -y
npm install express pg cors dotenv
```

Copy the `server.js` from `SETUP_GUIDE.md` Step 2.3

Then:
```bash
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/order_system" > .env
npm run dev
```

### Step 3: Frontend (1 min)
```bash
cd frontend
npm install
npm start
```

## Test It Works

1. **Backend**: http://localhost:8080/health
2. **Frontend**: http://localhost:3000
3. **Products API**: http://localhost:8080/v1/products

## What You Can Do Now

✅ Browse products and services  
✅ Create orders  
✅ Check payment status  
✅ View order history  
✅ Admin: see all orders and mark as paid  

---

**Need help?** See `SETUP_GUIDE.md` for detailed instructions and troubleshooting.
