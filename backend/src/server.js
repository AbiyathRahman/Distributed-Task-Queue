const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server, path: '/ws' });
const redis = require('ioredis');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const db = require('./services/db');
const jobsRouter = require('./routes/jobs');
const { setWebSocketServer, broadcast } = require('./broadcast');
const port = process.env.PORT || 3000;
const cors = require('cors');
const { getQueueDepths } = require('./services/queue');

// Configure CORS for production
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',              // Vite dev
            'http://localhost:3000',              // Express dev
            'http://localhost',                   // Docker local
            'https://your-project.vercel.app',   // Update with your Vercel domain
            process.env.FRONTEND_URL || ''        // Production frontend from env
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize WebSocket broadcast
setWebSocketServer(wss);

// Subscribe to worker heartbeats via Redis Pub/Sub
const redisSubscriber = new redis(process.env.REDIS_URL);
redisSubscriber.subscribe('worker-heartbeats', (err, count) => {
    if (err) {
        console.error('Failed to subscribe to worker-heartbeats:', err);
    } else {
        console.log(`Subscribed to ${count} channels`);
    }
});

redisSubscriber.on('message', (channel, message) => {
    if (channel === 'worker-heartbeats') {
        try {
            const heartbeat = JSON.parse(message);
            broadcast('worker_heartbeat', heartbeat);
        } catch (error) {
            console.error('Error parsing worker heartbeat:', error);
        }
    }
});

// Poll queue depths + broadcast every 2 seconds
setInterval(async () => {
    const depths = await getQueueDepths();
    broadcast('queue_update', depths);
}, 2000);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use('/jobs', jobsRouter);

// Connect to database first, then start the server
db.connectToServer((err) => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    }

    server.listen(port, () => {
        console.log(`Distributed Task Queue app listening on port ${port}`);
        console.log(`WebSocket available at ws://localhost:${port}/ws`);
    });
});


