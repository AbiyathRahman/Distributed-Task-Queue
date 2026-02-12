# Production Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                       │
│  https://your-project.vercel.app                            │
│  - React + Vite SPA                                         │
│  - Hosted on Vercel CDN                                     │
│  - Auto-deploys from GitHub                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTPS + WSS
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Render Web Service)                │
│  https://distributed-task-queue-api.onrender.com            │
│  - Express.js server                                        │
│  - 3 Worker replicas (background jobs)                      │
│  - Health check endpoint at /health                         │
└─────────────────┬──────────────────────┬────────────────────┘
                  │                      │
                  │ HTTPS                │ TCP
                  ↓                      ↓
        ┌─────────────────┐    ┌─────────────────┐
        │  MongoDB Atlas  │    │ Redis (Render)  │
        │  (Cloud DB)     │    │ (Job Queue)     │
        │  512MB Free     │    │ Hobby Free      │
        └─────────────────┘    └─────────────────┘
```

## Component Details

### Frontend (Vercel)

**What it does:**
- React dashboard for submitting and monitoring jobs
- Real-time updates via WebSocket
- Beautiful dark-themed UI with charts

**Deployment:**
- Automatic deployments from GitHub main branch
- Edge caching for static assets
- HTTPS by default
- Environment variables loaded at build time

**Environment Variables:**
```
VITE_API_BASE=https://distributed-task-queue-api.onrender.com/api
VITE_WS_URL=wss://distributed-task-queue-api.onrender.com/ws
```

**Performance:**
- CDN edge locations globally
- ~300ms-1s avg response time
- Automatic scaling

---

### Backend API (Render - Web Service)

**What it does:**
- Express.js REST API on port 3000
- WebSocket server on port 8080
- Job orchestration and routing
- Health monitoring

**Endpoints:**
```
GET  /health                    - Health check
GET  /jobs                      - List all jobs
POST /jobs                      - Submit new job
GET  /jobs/:id                  - Get job details
GET  /jobs/queue-depths         - Queue stats
GET  /jobs/dead-letter/list     - Failed jobs
POST /jobs/:id/requeue          - Requeue failed job
WS   /ws                        - WebSocket for live updates
```

**Startup Time:**
- ~10 seconds including MongoDB connection
- Health checks every 30 seconds

**Memory Usage:**
- ~150MB typical
- Scales to 1GB with loaded jobs

---

### Workers (Render - Background Workers ×3)

**What they do:**
- Long-running job processors
- Pull from Redis queue
- Execute job logic
- Report completions back to MongoDB
- Send heartbeats via Redis Pub/Sub

**Configuration:**
```
Worker 1: High priority (queue:high)
Worker 2: Medium priority (queue:medium)
Worker 3: Low priority (queue:low) + Dead-letter recovery
```

**Runtime:**
- Always running (no timeout)
- Restart on failure
- Independent scaling

---

### MongoDB Atlas (Cloud Database)

**What it stores:**
- Job documents (pending, running, completed, failed)
- Job history and metadata
- Configuration

**Collections:**
```
jobs        - All job records
deadletter  - Failed jobs for retry
```

**Features:**
- Shared tier (512MB free)
- Automatic backups
- HTTPS connections only
- IP whitelist security

---

### Redis (Render Add-on)

**What it stores:**
- Job queues (FIFO)
  - `queue:high` - High priority jobs
  - `queue:medium` - Medium priority jobs
  - `queue:low` - Low priority jobs
- Worker heartbeats (Pub/Sub)
  - `worker-heartbeats` - Redis channel

**Memory:**
- Hobby tier: 30MB
- Persists data with auto-recovery

---

## Data Flow

### 1. Submitting a Job

```
Frontend                Backend API            Redis Queue
   │                        │                      │
   ├─ POST /api/jobs ──────→│                      │
   │                        ├─ Validate job       │
   │                        ├─ Save to MongoDB────┐
   │                        │                     │
   │                        ├─ Push to queue ────→│
   │                        │    (high/med/low)   │
   │                        ├─ Broadcast update ─→ WebSocket
   │                        │                      │
   │←─ Job ID stored ───────┤                      │
   │                        │                      │
```

### 2. Processing a Job

```
Worker                 Redis Queue            MongoDB            Backend
  │                         │                   │                  │
  ├─ Pull from queue ───────┤                   │                  │
  │        (BLPOP)          │                   │                  │
  │                         ├─ jobId ──────────→│                  │
  │                         │                   │                  │
  ├─ Execute logic          │                   │ Update status   │
  │  (1-60 seconds)         │                   │ to 'running'    │
  │                         │                   │                  │
  ├─ Get result             │                   │                  │
  │   (success/error)       │                   │                  │
  │                         │                   │                  │
  └─ Update job ───────────────────────────────→│                  │
     (mark as complete)                         │                  │
                                                ├─ Notify ────────→ Broadcast
                                                │                to Frontend
```

### 3. Real-time Updates

```
Backend                 Redis Pub/Sub         Frontend (WebSocket)
   │                         │                      │
   ├─ Job completed          │                      │
   ├─ Publish to ───────────→│ worker-heartbeats    │
   │   worker-heartbeats     │                      │
   │                         ├─ Subscribe ←────────┤ ws://...
   │                         ├─ Heartbeat data ───→│
   │                         │   (worker status,    │
   │                         │    queue depths)     │
   │                         │                      ├─ Update UI
   │                         │                      │  (charts,
   │                         │                      │   job list)
```

---

## Scaling Strategy

### Current (Free/Starter)

- **Frontend**: Vercel free tier
- **API**: Render Standard ($7/month)
- **Workers**: 3× Free tier (up to 750 hrs/month each)
- **Database**: MongoDB free (512MB)
- **Queue**: Redis Hobby free (30MB)

### Growing to 10K jobs/day

```
Scale to:
┌────────────────────────────────────────┐
│ Frontend        → Vercel Pro           │
│ API             → Render Standard      │
│ Workers ×5      → Standard instances   │
│ MongoDB         → M0 Shared            │
│ Redis           → Standard ($27/mo)    │
│ Cost: $70-100/month                    │
└────────────────────────────────────────┘
```

### Growing to 100K jobs/day

```
Scale to:
┌────────────────────────────────────────┐
│ Frontend        → Vercel Enterprise    │
│ API ×2          → Standard (load bal)  │
│ Workers ×10     → Standard instances   │
│ MongoDB         → M10 Dedicated        │
│ Redis           → Premium ($150/mo)    │
│ Cost: $500-1000/month                  │
└────────────────────────────────────────┘
```

---

## Security

### Network
- ✅ All traffic encrypted (HTTPS/WSS)
- ✅ CORS configured to allow only Vercel domain
- ✅ Redis requires password authentication
- ✅ MongoDB IP whitelist enabled

### Secrets Management
- ✅ ATLAS_URI in Render environment (not in code)
- ✅ REDIS_URL in Render environment (not in code)
- ✅ Frontend URLs public (no secrets in frontend)
- ✅ No API keys in GitHub

### Backup & Recovery
- ✅ MongoDB automated backups (daily)
- ✅ Redis persistence enabled
- ✅ Render automatic restarts on crash
- ⚠️  Consider manual backup strategy for critical data

---

## Monitoring & Alerts

### Render Monitoring
- Health checks: `GET /health` every 30 seconds
- Auto-restart on failure
- Memory + CPU logs available
- Email alerts on deployment failure

### Setup Additional Monitoring

1. **Sentry** (Error tracking)
   ```javascript
   import * as Sentry from "@sentry/node";
   Sentry.init({ dsn: "..." });
   ```

2. **LogRocket** (User session replay)
   ```javascript
   import LogRocket from 'logrocket';
   LogRocket.init('app-slug');
   ```

3. **Uptime Monitors** (External monitoring)
   - Use services like UptimeRobot
   - Monitor: https://your-api.onrender.com/health
   - Alert on down

---

## Disaster Recovery

### If API crashes
- Render auto-restarts (takes 1-2 minutes)
- Queued jobs preserved in Redis
- Workers continue retrying

### If MongoDB goes down
- Render auto-backup system engages
- Last 24 hours of data available
- Jobs in memory survive, but failures may occur

### If Redis is lost
- Queued jobs lost (consider app-level retry)
- Workers need to be restarted manually
- Implement job persistence in MongoDB as backup

### If Frontend goes down
- Vercel auto-recovery (takes <1 minute)
- No data loss (frontend is stateless)
- API continues working

---

## Cost Optimization

### What to avoid
- ❌ Upgrading all services to paid immediately
- ❌ Using dedicated databases for testing
- ❌ Storing large files in MongoDB
- ❌ Having more than 5 worker replicas initially

### Cost-saving tips
- ✅ Start free, upgrade only as needed
- ✅ Use MongoDB free tier (great for small apps)
- ✅ Pause Render services when not developing
- ✅ Use caching aggressively
- ✅ Monitor quota usage in dashboards

### Free tier limits
- Vercel: Unlimited deployments, 100GB bandwidth/month
- Render: 750 hours/month per service (1 standard = $7)
- MongoDB: 512MB storage, 1M operations/month
- Redis: 30MB, 1000 connections

---

## Deployment Checklist

Before going live:

- [ ] GitHub repo public/private set correctly
- [ ] `.env` files NEVER committed
- [ ] ATLAS_URI and REDIS_URL added to Render
- [ ] MongoDB IP whitelist includes 0.0.0.0/0
- [ ] CORS configured for Vercel domain
- [ ] VITE_API_BASE and VITE_WS_URL point to Render
- [ ] Health endpoint tested: `curl https://your-api.onrender.com/health`
- [ ] Frontend loads without errors
- [ ] API calls succeed with 200 status
- [ ] WebSocket connects successfully
- [ ] Create test job through UI
- [ ] Verify job completed in worker
- [ ] Monitor logs for 5 minutes
- [ ] Set up Sentry for error tracking
- [ ] Announce to team! 🎉
