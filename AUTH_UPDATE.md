# 🔐 AUTHENTICATION NOW REQUIRED!

## ✅ What Changed

**ALL routes now require login** except:
- ✅ `/auth/register` - Sign up
- ✅ `/auth/login` - Login
- ✅ `/products/browse` - Browse products (read-only)
- ✅ `/sellers` - View sellers (read-only)

**Everything else requires JWT token from login!**

---

## 🚀 How to Update

### Step 1: Update Database (if not already done)

```bash
cd ~/Desktop/Projects/TikTokBooking
docker exec -i postgres psql -U postgres -d order_system < database/004_create_users_and_auth.sql
```

### Step 2: Restart Services

Stop and restart these services (Ctrl+C then restart):

```bash
# Terminal 1 - API Gateway (MUST restart)
cd ~/Desktop/Projects/TikTokBooking/services/api-gateway
npm start

# Terminal 2 - Catalog Service (MUST restart)
cd ~/Desktop/Projects/TikTokBooking/services/catalog-service
npm start

# Terminal 3 - Booking Service (MUST restart)
cd ~/Desktop/Projects/TikTokBooking/services/booking-service
npm start

# Terminal 7 - User Service (if not running)
cd ~/Desktop/Projects/TikTokBooking/services/user-service
npm install
npm start
```

---

## 🧪 Test Authentication Flow

### Step 1: Try Without Login (Should Fail)

```bash
# This will return 401 - Authentication required
curl http://localhost:8080/products
```

Response:
```json
{
  "error": "Authentication required",
  "message": "Please login to access this resource"
}
```

### Step 2: Register a New User

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "user_type": "client"
  }'
```

Response includes `token` - save this!

### Step 3: Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client1@example.com",
    "password": "password123"
  }'
```

Save the token from response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 4: Use Token to Access Protected Routes

```bash
# Set your token
TOKEN="paste_your_token_here"

# Now you can access products
curl http://localhost:8080/products \
  -H "Authorization: Bearer $TOKEN"

# Create a booking
curl -X POST http://localhost:8080/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 1}
    ]
  }'

# View your bookings
curl http://localhost:8080/bookings \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔓 Public vs Protected Routes

### PUBLIC (No Login Required):
```
GET  /auth/register     - Register new user
POST /auth/login        - Login
GET  /products/browse   - Browse products (read-only)
GET  /sellers           - View sellers
```

### PROTECTED (Login Required 🔐):
```
GET  /products          - Full product access
GET  /products/:id      - Product details
POST /products          - Create product (sellers only)

POST /bookings          - Create order
GET  /bookings          - View your orders
GET  /bookings/:id      - Order details

POST /payments/create   - Payment processing

GET  /auth/me           - Your profile
PUT  /sellers/profile   - Update seller profile

GET  /admin/orders      - Admin: All orders
POST /admin/orders/:id/mark-paid - Admin: Mark paid
```

---

## 🎯 User Flow

### For Clients:
1. Register → `/auth/register` (user_type: "client")
2. Login → `/auth/login` (get token)
3. Browse products → `/products` (with token)
4. Create order → `/bookings` (with token)
5. View orders → `/bookings` (with token)

### For Sellers:
1. Register → `/auth/register` (user_type: "seller")
2. Login → `/auth/login` (get token)
3. Create products → `/products` (with token)
4. View sales → `/bookings` (with token - shows their sales)
5. Update profile → `/sellers/profile` (with token)

### For Admin:
1. Login → `/auth/login` (admin credentials)
2. View all orders → `/admin/orders` (with token)
3. Mark orders paid → `/admin/orders/:id/mark-paid` (with token)

---

## 🔐 Sample Credentials

Use these to test:

| Email | Password | Type | Access |
|-------|----------|------|--------|
| client1@example.com | password123 | client | Buy products |
| seller1@example.com | password123 | seller | Sell products |
| admin@example.com | password123 | admin | Full access |

---

## 📱 Frontend Integration (Next Steps)

Your frontend needs to:

1. **Add Login Page**
   - Email + Password form
   - Call `/auth/login`
   - Store token in localStorage

2. **Add Registration Page**
   - Choose: Client or Seller
   - Call `/auth/register`
   - Store token

3. **Add Token to All Requests**
   ```javascript
   const token = localStorage.getItem('token');
   axios.get('/products', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

4. **Handle 401 Errors**
   - If token expired → redirect to login
   - Show "Session expired" message

---

## ✅ What You Get Now

- ✅ **Secure**: All sensitive operations require login
- ✅ **User tracking**: Know who created each order
- ✅ **Role-based**: Clients buy, sellers sell, admins manage
- ✅ **JWT tokens**: Stateless authentication
- ✅ **7-day sessions**: Tokens valid for 7 days
- ✅ **Protected routes**: No unauthorized access

---

## 🧪 Quick Test Script

```bash
# Test the full flow
cd ~/Desktop/Projects/TikTokBooking

# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client1@example.com","password":"password123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Get products (with auth)
curl -s http://localhost:8080/products \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Create booking
curl -s -X POST http://localhost:8080/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"product_id":1,"quantity":1}]}' | jq

# 4. View bookings
curl -s http://localhost:8080/bookings \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🎉 Done!

Your platform is now **fully secured with authentication**!

- ✅ Users must login to buy/sell
- ✅ Orders track both client and seller
- ✅ JWT tokens for security
- ✅ Role-based access control

**Restart your services and test it!** 🚀
