# 🔄 UPDATE: Client & Seller Functionality Added!

## ✅ What's New

### 1. **New User Service** (Port 3001)
- User registration (client or seller)
- Login/authentication
- JWT tokens
- User profiles
- Seller profiles with business info

### 2. **Database Updates**
- New users table with client/seller types
- Seller profiles table
- Products linked to sellers
- Orders track both client and seller

### 3. **User Types**
- **Client**: Can browse and purchase products/services
- **Seller**: Can list and manage their products/services
- **Admin**: Can manage everything

---

## 🚀 How to Update Your System

### Step 1: Update Database

```bash
cd ~/Desktop/Projects/TikTokBooking

# Load new database schema
docker exec -i postgres psql -U postgres -d order_system < database/004_create_users_and_auth.sql
```

This will:
- ✅ Create users table with client/seller support
- ✅ Create seller profiles
- ✅ Link products to sellers
- ✅ Add 5 sample users (2 clients, 2 sellers, 1 admin)

### Step 2: Install User Service Dependencies

```bash
cd ~/Desktop/Projects/TikTokBooking/services/user-service
npm install
```

### Step 3: Start User Service (New Terminal)

Open a **new terminal** (Terminal 7):

```bash
cd ~/Desktop/Projects/TikTokBooking/services/user-service
npm start
```

You should see:
```
✅ USER SERVICE running on port 3001
   Supports: Clients, Sellers, Authentication
```

### Step 4: Restart API Gateway

Stop your API Gateway (Ctrl+C) and restart it:

```bash
cd ~/Desktop/Projects/TikTokBooking/services/api-gateway
npm start
```

It will now route `/auth/*`, `/sellers/*`, `/clients/*` to the User Service.

---

## 🧪 Test the New Features

### Test 1: Register a New Client

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newclient@example.com",
    "password": "password123",
    "name": "New Client",
    "user_type": "client"
  }'
```

### Test 2: Register a New Seller

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newseller@example.com",
    "password": "password123",
    "name": "New Seller",
    "user_type": "seller",
    "business_name": "My Business",
    "description": "We sell great products",
    "category": "Technology"
  }'
```

### Test 3: Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client1@example.com",
    "password": "password123"
  }'
```

Response includes a `token` - use this for authenticated requests!

### Test 4: Get All Sellers

```bash
curl http://localhost:8080/sellers
```

You'll see 2 verified sellers with their ratings and business info.

### Test 5: Get Seller's Products

```bash
curl http://localhost:8080/sellers/4/products
```

---

## 📊 Sample Users Created

| Email | Password | Type | Description |
|-------|----------|------|-------------|
| admin@example.com | password123 | admin | Admin user |
| client1@example.com | password123 | client | John Doe |
| client2@example.com | password123 | client | Jane Smith |
| seller1@example.com | password123 | seller | Tech Solutions Inc |
| seller2@example.com | password123 | seller | Creative Designs Co |

---

## 🎯 API Endpoints Added

### Authentication
- `POST /auth/register` - Register new user (client or seller)
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info (requires token)

### Sellers
- `GET /sellers` - List all verified sellers
- `GET /sellers/:id` - Get seller details
- `GET /sellers/:id/products` - Get products by seller
- `PUT /sellers/profile` - Update seller profile (requires seller token)

### Clients
- `GET /clients` - List all clients (admin only)

---

## 🔐 Using JWT Tokens

After login, you get a token. Use it like this:

```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@example.com","password":"password123"}' \
  | jq -r '.token')

# Use token for authenticated requests
curl http://localhost:8080/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Updated Project Structure

```
services/
├── api-gateway/       ← Updated routes
├── user-service/      ← NEW! (Port 3001)
├── catalog-service/
├── booking-service/
├── payment-service/
└── integration-service/

database/
├── 001_create_products_table.sql
├── 002_create_orders_table.sql
├── 003_create_users_table.sql
└── 004_create_users_and_auth.sql  ← NEW!
```

---

## 🎨 Frontend Updates Needed (Coming Next)

The backend is ready! Next steps for frontend:
1. Add login/register pages
2. Add seller dashboard
3. Show seller info on products
4. Filter products by seller
5. Client order history
6. Seller sales dashboard

---

## ✅ Verification

Check everything is working:

```bash
# 1. User Service running
curl http://localhost:8080/auth/me

# 2. Database updated
docker exec postgres psql -U postgres -d order_system -c "SELECT COUNT(*) FROM users;"
# Should return: 5

# 3. Sellers available
curl http://localhost:8080/sellers
# Should return: 2 sellers

# 4. Products linked to sellers
curl http://localhost:8080/products
# Each product now has a seller_id
```

---

## 🚀 Now Running

You should now have **7 services** running:

1. API Gateway (8080)
2. **User Service (3001)** ← NEW!
3. Catalog Service (3002)
4. Booking Service (3003)
5. Payment Service (3004)
6. Integration Service (3008)
7. Frontend (3000)

---

## 🎉 Done!

Your platform now supports:
- ✅ Client registration and login
- ✅ Seller registration and profiles
- ✅ Products linked to sellers
- ✅ JWT authentication
- ✅ Seller management

**Ready for the frontend updates!** 🚀
