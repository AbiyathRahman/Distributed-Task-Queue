# Deployment Guide: Render + Vercel

## Overview

- **Backend API + Workers**: Deployed on Render
- **Frontend**: Deployed on Vercel
- **Databases**: MongoDB Atlas (cloud) + Redis (on Render or alternative)
- **Real-time**: WebSocket connection through Render → Vercel

---

## Part 1: Backend Deployment to Render

### Prerequisites

1. GitHub account (repo must be public or private with access)
2. Render account (https://render.com)
3. MongoDB Atlas account with cluster (https://www.mongodb.com/cloud/atlas)
4. Redis instance (Render offers add-ons)

### Step 1: Set Up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new project
3. Create a cluster (free tier available)
4. Get connection string:
   - Click "Connect" → "Drivers"
   - Copy the MongoDB+SRV connection string
   - Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?appName=nameofapp`
5. Save this as `ATLAS_URI`

### Step 2: Set Up Redis on Render

Option A: Use Render's Redis Add-on
1. During deployment setup (see Step 4), Render will offer Redis add-on
2. Cost: ~$7/month for hobby tier
3. Connection string will be automatically provided

Option B: Use External Redis (e.g., Redis Cloud)
1. Go to https://redis.com/try-free/
2. Create a free Redis database
3. Get the connection string (redis://...)
4. Save as `REDIS_URL`

### Step 3: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Distributed-Task-Queue.git
git push -u origin main
```

### Step 4: Deploy to Render

#### Option A: One-Click Deploy (Recommended)

1. Go to https://render.com/deploy
2. Click "Create New" → "Blueprint"
3. Connect your GitHub repo
4. Fill in environment variables:
   - `ATLAS_URI`: Your MongoDB connection string
   - `REDIS_URL`: Your Redis connection string
   - `NODE_ENV`: `production`

#### Option B: Manual Setup

1. Login to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `distributed-task-queue-api`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm ci`
   - **Start Command**: `cd backend && node src/server.js`
   - **Instance Type**: Standard ($7/month)
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   ATLAS_URI=mongodb+srv://...
   REDIS_URL=redis://...
   NUM_WORKERS=3
   MAX_WORKERS=8
   AUTOSCALE_THRESHOLD=20
   ```
6. Click "Create Web Service"

### Step 5: Deploy Workers

Repeat for each worker (3 total):

1. Click "New +" → "Background Worker"
2. Same GitHub repo, same environment
3. **Name**: `distributed-task-queue-worker-1`
4. **Build Command**: `cd backend && npm ci`
5. **Start Command**: `cd backend && node src/worker.js`
6. Same environment variables + `WORKER_ID=worker-1` (or 2/3 for others)
7. Click "Create Background Worker"

### Step 6: Get Your Backend URL

After deployment:
- API URL: `https://distributed-task-queue-api.onrender.com`
- Note this for frontend deployment

---

## Part 2: Frontend Deployment to Vercel

### Prerequisites

1. Vercel account (https://vercel.com - free tier)
2. GitHub repo with frontend code
3. Backend API URL from Render (above)

### Step 1: Create `.env.production` File

Create `frontend/.env.production`:

```env
VITE_API_BASE=https://distributed-task-queue-api.onrender.com/api
VITE_WS_URL=wss://distributed-task-queue-api.onrender.com/ws
```

**Note**: Use `https://` for API and `wss://` (secure WebSocket) for production!

### Step 2: Update Frontend Code

In `frontend/src/App.jsx`, ensure it handles environment variables:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || 'https://your-backend.onrender.com/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'wss://your-backend.onrender.com/ws';
```

### Step 3: Push to GitHub (if not already)

```bash
git add frontend/.env.production
git commit -m "Add production environment variables"
git push
```

### Step 4: Deploy to Vercel

#### Option A: Vercel CLI (Fastest)

```bash
npm install -g vercel
cd frontend
vercel
```

Follow prompts:
- Link to GitHub repo
- Set project name
- Choose framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

#### Option B: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite / React
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_API_BASE=https://distributed-task-queue-api.onrender.com/api
   VITE_WS_URL=wss://distributed-task-queue-api.onrender.com/ws
   ```
6. Click "Deploy"

### Step 5: Get Your Frontend URL

After deployment:
- Frontend URL: `https://your-project.vercel.app`

---

## Post-Deployment: Connect Frontend to Backend

### Update Backend CORS

In `backend/src/server.js`, update CORS configuration:

```javascript
const cors = require('cors');
const allowedOrigins = [
  'http://localhost:5173',           // Local dev
  'http://localhost:3000',           // Local dev with port
  process.env.VERCEL_URL,            // Vercel preview deployments
  'https://your-project.vercel.app'  // Vercel production
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
```

---

## Testing Production Deployment

### Test Backend API
```bash
# Health check
curl https://distributed-task-queue-api.onrender.com/health

# Get jobs
curl https://distributed-task-queue-api.onrender.com/jobs

# Submit a job
curl -X POST https://distributed-task-queue-api.onrender.com/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{},"priority":"high"}'
```

### Test Frontend
1. Open https://your-project.vercel.app in browser
2. Check browser DevTools → Network tab
3. Should see requests to `https://distributed-task-queue-api.onrender.com/api/...`
4. Should see WebSocket connection to `wss://distributed-task-queue-api.onrender.com/ws`

---

## Cost Breakdown

| Service | Tier | Cost/Month |
|---------|------|-----------|
| Render Web | Starter | Free (0-100k requests) |
| Render Web | Standard | $7 |
| Render Background Worker (×3) | Starter | Free (0-750 hours/month) |
| Render Background Worker (×3) | Standard | $7 each = $21 |
| Render Redis Add-on | Hobby | $7 |
| Vercel Frontend | Hobby | Free |
| MongoDB Atlas | Free (512MB) | Free |
| **Total** | | **~$35/month** |

---

## Environment Variables Summary

### Render Environment Variables

**API Service:**
```
NODE_ENV=production
PORT=3000
ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=app
REDIS_URL=redis://user:pass@redis-host:port
NUM_WORKERS=3
MAX_WORKERS=8
AUTOSCALE_THRESHOLD=20
```

**Worker Services:**
```
NODE_ENV=production
ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=app
REDIS_URL=redis://user:pass@redis-host:port
WORKER_ID=worker-1 (or 2, 3)
```

### Vercel Environment Variables

```
VITE_API_BASE=https://distributed-task-queue-api.onrender.com/api
VITE_WS_URL=wss://distributed-task-queue-api.onrender.com/ws
```

---

## Troubleshooting

### Backend Won't Start
- Check logs: Render Dashboard → Service → Logs
- Verify `ATLAS_URI` and `REDIS_URL` are correct
- Ensure MongoDB Atlas allows connections from Render IPs (IP whitelist)

### Frontend Shows 502 Error
- Verify `VITE_API_BASE` points to correct Render URL
- Check CORS is enabled in backend
- Check backend is running: Test health endpoint

### WebSocket Connection Fails
- Ensure `VITE_WS_URL` uses `wss://` (secure WebSocket)
- Verify backend is running
- Check proxy configuration in Vercel

### Workers Not Processing Jobs
- Check worker logs in Render Dashboard
- Verify `REDIS_URL` is accessible to workers
- Ensure MongoDB has `NUM_WORKERS` set

---

## Deployment Commands Reference

```bash
# Local testing before deployment
docker-compose up

# Push changes to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# View Render logs
# Go to: https://dashboard.render.com → Your Service → Logs

# View Vercel logs
# Go to: https://vercel.com/dashboard → Your Project → Deployments → Logs
```

---

## Next Steps After Deployment

1. ✅ Monitor backend health: Check Render Dashboard regularly
2. ✅ Set up monitoring: Enable alerts in Render
3. ✅ Scale as needed: Upgrade instance types if needed
4. ✅ Set custom domain: Add domain to Vercel
5. ✅ Enable analytics: Vercel provides built-in analytics

---

## Security Best Practices

1. **Never commit `.env` files** - Use deployment platform's environment variable settings
2. **Use HTTPS/WSS** - Always use secure protocols in production
3. **Rotate credentials** - Periodically change ATLAS_URI and REDIS_URL
4. **Enable MongoDB IP whitelist** - Only allow Render IPs
5. **Use environment-specific configs** - Separate dev and prod settings
6. **Enable CORS selectively** - Only allow your Vercel domain
