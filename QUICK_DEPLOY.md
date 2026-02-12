# Quick Deploy to Render + Vercel

Complete deployment in 10 minutes!

## Prerequisites
- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Push Code to GitHub (2 min)

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Distributed-Task-Queue.git
git push -u origin main
```

## Step 2: Set Up MongoDB Atlas (2 min)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Create Project" → Name it
3. Click "Build a Database" → Choose "Shared" (Free)
4. Choose region, click "Create Deployment"
5. Set username/password
6. Click "Databases" → "Connect" → "Drivers"
7. Copy the connection string that looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?appName=app
   ```
8. **Save this as your ATLAS_URI**

⚠️ **Important**: In MongoDB Atlas, go to "Security" → "Network Access" and set it to use "0.0.0.0/0" (allow all IPs) for production. Render's IP is dynamic.

## Step 3: Set Up Redis (1 min)

Visit https://redis.com/try-free and get a free Redis database, or use Render's add-on.

Copy connection string like: `redis://user:pass@redis-host:6379`

**Save this as your REDIS_URL**

## Step 4: Deploy Backend to Render (3 min)

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Choose "Public Git repository" and paste your GitHub repo URL
4. Configure:
   - **Name**: `distributed-task-queue-api`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm ci`
   - **Start Command**: `cd backend && node src/server.js`
   - **Autodeployments**: Toggle ON
5. Click "Create Web Service"
6. Go to "Environment" → "Environment Variables"
7. Add these:
   ```
   NODE_ENV = production
   ATLAS_URI = [paste your MongoDB connection string]
   REDIS_URL = [paste your Redis connection string]
   NUM_WORKERS = 3
   MAX_WORKERS = 8
   AUTOSCALE_THRESHOLD = 20
   ```
8. Click "Redeploy"

⏱️ Wait 3-5 minutes for deployment to complete...

**After deployment, note your backend URL:**
```
https://distributed-task-queue-api.onrender.com
```

## Step 5: Deploy Workers (2 min)

Repeat **3 times** for workers 1, 2, and 3:

1. In Render Dashboard, click "New +" → "Web Service"
2. Choose your GitHub repo again
3. Configure:
   - **Name**: `distributed-task-queue-worker-1` (2, 3 for others)
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm ci`
   - **Start Command**: `node backend/src/worker-server.js`
4. Go to "Environment" → Add same variables as backend:
   ```
   NODE_ENV = production
   ATLAS_URI = [your MongoDB URI]
   REDIS_URL = [your Redis URI]
   NUM_WORKERS = 3
   MAX_WORKERS = 8
   AUTOSCALE_THRESHOLD = 20
   ```
5. Click "Create Web Service"

✨ **Why Web Services?** Render Web Services have a free tier (auto-suspend after 15 min idle). Background Workers are paid ($7+/month). Workers run the same code with a lightweight HTTP health check endpoint.

## Step 6: Deploy Frontend to Vercel (2 min)

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Environment Variables" and add:
   ```
   VITE_API_BASE = https://distributed-task-queue-api.onrender.com/api
   VITE_WS_URL = wss://distributed-task-queue-api.onrender.com/ws
   ```
   (Replace with your actual Render URL from Step 4)
6. Click "Deploy"

⏱️ Wait 1-2 minutes for build to complete...

**After deployment, get your frontend URL:**
```
https://your-project.vercel.app
```

## Step 7: Test Everything (1 min)

### Test Backend
```bash
curl https://distributed-task-queue-api.onrender.com/health
# Should return 200 with { status: 'ok' }
```

### Test Frontend
1. Open https://your-project.vercel.app in browser
2. You should see the dashboard
3. Try submitting a job
4. Check DevTools → Network and WebSocket tabs should show successful connections

## Done! 🚀

Your application is now live!

- **Frontend**: https://your-project.vercel.app
- **Backend API**: https://distributed-task-queue-api.onrender.com
- **3 Workers**: Running in background on Render

---

## Cost Summary

| Service | Cost |
|---------|------|
| Vercel Frontend | Free |
| Render API (Web Service) | Free (+ $7/month if you need always-on) |
| Render Workers ×3 (Web Services) | Free (auto-suspend after 15 min idle) |
| Redis | Free (Redis Cloud free tier) |
| MongoDB Atlas | Free (512MB) |
| **Total** | **FREE** (or $7/month for always-on API) |

**💰 Pro Tip**: Everything runs free with auto-suspend. Add $7/month to keep API always-on (workers auto-resume when jobs arrive via Redis)

---

## Updating Your App

Whenever you push changes to GitHub:

1. **Backend**: Render auto-redeploys (if autodeployment enabled)
2. **Frontend**: Vercel auto-redeploys on push to main
3. Check deployment status in respective dashboards

---

## Troubleshooting

### Backend won't deploy
- Check Render logs: Dashboard → Service → Logs
- Verify ATLAS_URI and REDIS_URL are correct
- Ensure MongoDB whitelist allows all IPs (0.0.0.0/0)

### Frontend shows errors
- Check Vercel logs: Dashboard → Deployments → Logs
- Verify VITE_API_BASE points to correct Render URL
- Check browser console for JavaScript errors

### Jobs not processing
- Check worker status in Render Dashboard
- Verify REDIS_URL is accessible
- Check worker logs for errors

---

## Next Steps

1. Add custom domain to Vercel
2. Set up monitoring alerts
3. Configure auto-scaling rules
4. Enable CDN caching
5. Set up error tracking (Sentry)
