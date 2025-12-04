# Auto-Start Services Branch

This branch contains an enhanced version of the `START_EVERYTHING.sh` script that automatically starts all microservices and the frontend application.

## What's New

### 1. **Automated Service Starting** 
The `START_EVERYTHING.sh` script now automatically:
- Sets up infrastructure (PostgreSQL, Redis, Kafka via Docker)
- Installs all dependencies
- Starts all microservices in the background
- Starts the frontend application
- Creates log files for each service
- Saves process IDs for easy management

### 2. **STOP_EVERYTHING.sh Script**
A new companion script to gracefully stop all running services:
- Stops all microservices using saved PID files
- Shuts down Docker infrastructure
- Cleans up PID files

### 3. **.gitignore File**
Proper Git ignore rules for:
- Log files and directories
- Node modules
- Environment files
- Build outputs
- IDE and OS-specific files

## Usage

### Starting All Services
```bash
./START_EVERYTHING.sh
```

This single command will:
1. ✅ Verify Docker is running
2. 🐳 Start infrastructure containers
3. 🗄️ Initialize databases
4. 📦 Install dependencies
5. 🚀 Start all services automatically
6. 📊 Create logs in `logs/` directory

### Viewing Logs
```bash
# View real-time logs for any service
tail -f logs/api-gateway.log
tail -f logs/catalog-service.log
tail -f logs/booking-service.log
tail -f logs/payment-service.log
tail -f logs/integration-service.log
tail -f logs/frontend.log
```

### Stopping All Services
```bash
./STOP_EVERYTHING.sh
```

## Service URLs

After starting, access your services at:
- 🌐 **Frontend**: http://localhost:3000
- 🚪 **API Gateway**: http://localhost:8080
- 📦 **Products**: http://localhost:8080/products
- 📋 **Bookings**: http://localhost:8080/bookings

## Technical Details

### Process Management
- Each service runs with `nohup` for persistence
- Process IDs are saved in `logs/*.pid` files
- Logs are redirected to `logs/*.log` files
- Services start with 2-second delays between each to ensure proper initialization

### Docker Compose Compatibility
The script supports both:
- Modern `docker compose` (Docker CLI plugin)
- Legacy `docker-compose` (standalone tool)

### Log Files
All service logs are centralized in the `logs/` directory:
- `api-gateway.log` - API Gateway service logs
- `catalog-service.log` - Catalog/Products service logs
- `booking-service.log` - Booking service logs
- `payment-service.log` - Payment service logs
- `integration-service.log` - TikTok integration service logs
- `frontend.log` - React frontend logs

## Benefits

✅ **One-Command Startup** - No need to open multiple terminals
✅ **Background Processes** - Services run in the background with nohup
✅ **Centralized Logs** - All logs in one place
✅ **Easy Monitoring** - Use tail -f to monitor any service
✅ **Clean Shutdown** - Graceful service termination
✅ **PID Management** - Easy to track and manage running processes

## Troubleshooting

### Services Not Starting
1. Check logs: `cat logs/<service-name>.log`
2. Verify Docker is running: `docker info`
3. Check if ports are available: `lsof -i :8080` (for API Gateway)

### Docker Compose Error
If you see "docker-compose: command not found":
- Install Docker Desktop (includes docker compose)
- Or install docker-compose separately

### Port Already in Use
If a port is already occupied:
1. Stop all services: `./STOP_EVERYTHING.sh`
2. Check for lingering processes: `ps aux | grep node`
3. Kill any remaining processes: `pkill -f node`

## Comparison with Original

| Feature | Original Script | Auto-Start Branch |
|---------|----------------|-------------------|
| Infrastructure Setup | ✅ Yes | ✅ Yes |
| Dependency Installation | ✅ Yes | ✅ Yes |
| Service Starting | ❌ Manual | ✅ Automatic |
| Log Management | ❌ No | ✅ Centralized |
| Stop Script | ❌ No | ✅ Yes |
| Process Tracking | ❌ No | ✅ PID files |
| .gitignore | ❌ No | ✅ Yes |
