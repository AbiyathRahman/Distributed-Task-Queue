# Docker Setup Guide

## Architecture

Your application is now fully containerized with:

- **Multi-stage Dockerfile**: Optimized image size with separate build and runtime stages
- **Separate Services**: Server and worker processes run as independent containers
- **Health Checks**: Docker monitors service health automatically
- **Network Isolation**: Services communicate via Docker network (`dtq-network`)
- **Data Persistence**: MongoDB data persists in Docker volumes

## Services

### Database Services
- **MongoDB** (mongo:7): NoSQL database on `mongodb:27017`
- **Redis** (redis:7-alpine): Caching and job queue on `redis:6379`

### Backend Services
- **backend-server**: Express API server on port 3000, WebSocket on port 8080
- **backend-worker-1, 2, 3**: Three parallel job worker instances

### Frontend Service
- **frontend**: React + Vite app served by Nginx on port 80

## Quick Start

### 1. Build and Start All Services
```bash
docker-compose up --build
```

Then open your browser:
- **🌐 Frontend**: http://localhost
- **📊 API**: http://localhost/api/jobs
- **🔌 WebSocket**: ws://localhost/ws

### 2. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend-server
docker-compose logs -f backend-worker-1
```

### 3. Scale Workers
Add more worker services in `docker-compose.yml`:
```yaml
backend-worker-4:
  build:
    context: ./backend
    dockerfile: Dockerfile
  command: node src/worker.js
  depends_on: [mongodb, redis]
  environment:
    WORKER_ID: worker-4
```

Then restart:
```bash
docker-compose up -d
```

### 4. Stop Services
```bash
docker-compose down
```

### 5. Remove Data (Cleanup)
```bash
docker-compose down -v
```

## Multi-stage Dockerfile Explanation

**Stage 1 (Builder)**
- Installs Node.js dependencies
- Copies source code
- Creates intermediate image (not in final product)

**Stage 2 (Runtime)**
- Copies only `node_modules` and source from builder
- Runs as non-root user (nodejs)
- Much smaller final image size

**Benefits:**
- ✅ Smaller production images (no build tools or source duplicates)
- ✅ Faster deployments
- ✅ Better security (non-root user)
- ✅ Health checks enabled

## Environment Variables

Services use these environment variables (set in docker-compose.yml):

```
NODE_ENV=production
PORT=3000
ATLAS_URI=mongodb://mongodb:27017/taskqueue
REDIS_URL=redis://redis:6379
NUM_WORKERS=3
MAX_WORKERS=8
AUTOSCALE_THRESHOLD=20
```

## Useful Docker Commands

```bash
# Build images
docker-compose build

# Start in background
docker-compose up -d

# See running containers
docker ps

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Shell into container
docker-compose exec backend-server sh

# Restart specific service
docker-compose restart backend-worker-1

# Remove stopped containers
docker-compose rm -f

# View resource usage
docker stats
```

## Debugging

### Check Service Health
```bash
docker-compose ps
```

### View Detailed Logs
```bash
docker-compose logs --tail=100 backend-server
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-11T12:34:56.789Z",
  "uptime": 123.456
}
```

### Connect to MongoDB
```bash
docker-compose exec mongodb mongosh taskqueue
```

### Test Redis
```bash
docker-compose exec redis redis-cli ping
```

## Production Considerations

1. **Resource Limits**: Add `mem_limit` and `cpus` in docker-compose.yml
2. **Environment Separation**: Use separate `.env.production` files
3. **Logging**: Configure log drivers for centralized logging
4. **Networking**: Expose only necessary ports to public
5. **MongoDB Authentication**: Add username/password in production
6. **Redis Authentication**: Enable Redis ACLs in production
7. **Secrets Management**: Use Docker secrets for sensitive data

Example production update:
```yaml
backend-server:
  mem_limit: 512m
  cpus: "0.5"
  restart: always
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

## Network Communication

Services communicate via the `dtq-network` bridge:
- `backend-server` → `mongodb:27017`
- `backend-server` → `redis:6379`
- `backend-worker-*` → `mongodb:27017`
- `backend-worker-*` → `redis:6379`

No need for localhost - Docker DNS resolves service names automatically!

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | `docker-compose down` then restart |
| MongoDB won't start | Check volume permissions, `docker volume prune` |
| Workers not processing jobs | Check REDIS_URL, verify Redis is running |
| Health check failing | Ensure `/health` endpoint exists in server.js |
| Out of disk space | `docker system prune -a` to clean up |

## Next Steps

1. ✅ Multi-stage Dockerfile configured
2. ✅ Separate worker services running
3. 📋 Optional: Add frontend service to docker-compose.yml
4. 📋 Optional: Set up CI/CD pipeline to build and push images
5. 📋 Optional: Deploy to Kubernetes or Docker Swarm

