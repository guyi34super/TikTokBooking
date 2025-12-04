# 🚀 Quick Start Guide

## The Problem You're Seeing

```
Error occurred while trying to proxy: localhost:8080/auth/login
```

**This means:** The services aren't running yet! ❌

---

## ✅ Solution: Start All Services

### Step 1: Check Service Status
```bash
./CHECK_SERVICES.sh
```

This will show you which services are running.

### Step 2: Start Everything
```bash
./START_EVERYTHING.sh
```

This will:
- ✅ Start Docker (PostgreSQL, Redis, Kafka)
- ✅ Create databases
- ✅ Install dependencies
- ✅ Start all 6 services automatically
- ✅ Create log files

**Wait ~15-20 seconds** for all services to initialize.

### Step 3: Verify Services Are Running

```bash
# Check if services are up
curl http://localhost:8080/health

# Should return:
# {"status":"ok","service":"api-gateway","timestamp":"..."}
```

### Step 4: Now Try Login Again

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client1@example.com",
    "password": "password123"
  }'
```

**Should return:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "email": "client1@example.com",
    "name": "Client One",
    "user_type": "client"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🔍 Troubleshooting

### Services Won't Start?

**Check logs:**
```bash
# View all logs
tail -f logs/*.log

# Or check specific service
tail -f logs/api-gateway.log
tail -f logs/user-service.log
```

### Docker Issues?

```bash
# Check if Docker is running
docker info

# Check containers
docker ps

# Restart infrastructure
cd infrastructure
docker compose down
docker compose up -d
cd ..
```

### Port Already in Use?

```bash
# Find what's using port 8080
lsof -i :8080

# Kill it
kill -9 <PID>

# Or kill all node processes
pkill -f node
```

### Database Not Initialized?

```bash
# Re-initialize database
docker exec -i postgres psql -U postgres -d order_system < database/001_create_products_table.sql
docker exec -i postgres psql -U postgres -d order_system < database/002_create_orders_table.sql
docker exec -i postgres psql -U postgres -d order_system < database/003_create_users_table.sql
docker exec -i postgres psql -U postgres -d order_system < database/004_create_users_and_auth.sql
```

---

## 📋 Service Checklist

All these should be running:

| Service | Port | Status |
|---------|------|--------|
| API Gateway | 8080 | `curl http://localhost:8080/health` |
| User Service | 3001 | Handles auth/login |
| Catalog Service | 3002 | Products |
| Booking Service | 3003 | Orders |
| Payment Service | 3004 | Payments |
| Integration | 3008 | TikTok |
| Frontend | 3000 | React app |
| PostgreSQL | 5432 | Docker |
| Redis | 6379 | Docker |
| Kafka | 9092 | Docker |

---

## 🎯 Quick Commands Reference

```bash
# Start everything
./START_EVERYTHING.sh

# Check what's running
./CHECK_SERVICES.sh

# Stop everything
./STOP_EVERYTHING.sh

# View logs
tail -f logs/*.log

# Test API Gateway
curl http://localhost:8080/health

# Test login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client1@example.com","password":"password123"}'

# Access frontend
open http://localhost:3000
```

---

## ⚡ Expected Timeline

After running `./START_EVERYTHING.sh`:

- **0-5s**: Docker containers starting
- **5-10s**: Installing dependencies
- **10-15s**: Starting all services
- **15-20s**: ✅ Everything ready!

**Total time: ~20 seconds** ⏱️

---

## 💡 Pro Tips

1. **Always check logs first** if something doesn't work:
   ```bash
   tail -f logs/api-gateway.log
   ```

2. **Use CHECK_SERVICES.sh** to diagnose:
   ```bash
   ./CHECK_SERVICES.sh
   ```

3. **Clean restart** if things are broken:
   ```bash
   ./STOP_EVERYTHING.sh
   pkill -f node  # Kill any lingering processes
   ./START_EVERYTHING.sh
   ```

4. **Frontend takes longest** to start (Vite dev server)
   - Backend services ready in ~10s
   - Frontend ready in ~15-20s

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ `./CHECK_SERVICES.sh` shows all services running
2. ✅ `curl http://localhost:8080/health` returns JSON
3. ✅ Login API call returns a token
4. ✅ Frontend loads at http://localhost:3000
5. ✅ No errors in `logs/*.log` files

---

## 🆘 Still Not Working?

1. Check you're on the right branch:
   ```bash
   git branch --show-current
   # Should show: auto-start-services
   ```

2. Make sure Docker Desktop is running

3. Check if ports are available (nothing else using 3000, 8080, etc.)

4. Try a complete reset:
   ```bash
   ./STOP_EVERYTHING.sh
   pkill -f node
   cd infrastructure && docker compose down && docker compose up -d && cd ..
   sleep 5
   ./START_EVERYTHING.sh
   ```

5. Check the logs for specific error messages

---

**Most Common Issue:** Forgot to run `./START_EVERYTHING.sh` first! 😄
