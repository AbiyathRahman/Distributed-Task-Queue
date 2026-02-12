# Distributed Task Queue - Frontend Dashboard

This is the React frontend dashboard for the Distributed Task Queue system. It provides real-time monitoring and control of jobs, workers, and queue depths.

## Features

- **📊 Metrics Dashboard** - View total jobs, completed, failed, and pending counts
- **📋 Job Submission Form** - Submit new jobs with different types and priorities
- **🔄 Real-Time Job List** - View and monitor all jobs with live status updates
- **📈 Queue Depth Visualization** - Monitor job counts by priority level
- **⚙️ Worker Status** - See active workers and their status
- **💀 Dead Letter Queue** - Manage failed jobs and requeue them

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React 18
- Vite (build tool)
- Axios (HTTP client)
- Recharts (charting library)
- Tailwind CSS (styling)

### 2. Configure Environment

The frontend expects the backend API to be running on `http://localhost:3000` and WebSocket on `ws://localhost:8080`.

If you need to change these, update the `API_BASE` constant in each component file.

### 3. Start the Development Server

```bash
npm run dev
```

The dashboard will open at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── MetricsCard.jsx      # Metrics display
│   │   ├── JobSubmissionForm.jsx # Job submission
│   │   ├── JobsList.jsx          # Recent jobs list
│   │   ├── QueueDepth.jsx        # Queue visualization
│   │   ├── WorkerStatus.jsx      # Worker monitoring
│   │   └── DeadLetterQueue.jsx   # Failed jobs management
│   ├── hooks/
│   │   └── useWebSocket.js       # WebSocket connection hook
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Tailwind CSS
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Build for Production

```bash
npm run build
npm run preview
```

## Requirements

- Backend API running on port 3000
- WebSocket server running on port 8080
- Node.js 16+ and npm 7+

## Troubleshooting

- **CORS errors**: Make sure your backend has CORS enabled with `app.use(cors())`
- **WebSocket connection failed**: Ensure WebSocket server is running on port 8080
- **404 errors on API calls**: Check that backend server is running on port 3000
- **No jobs showing**: Submit a job via the form and wait a moment for the list to update

## Next Steps

### Week 4 Enhancements
- Worker heartbeat system with Redis Pub/Sub
- Job completion throughput chart
- More advanced filtering and search
- Real-time alerts for job failures
- Job retry/recovery UI improvements
