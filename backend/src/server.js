const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({
    server,
    path: '/ws',
    perMessageDeflate: false,
    verifyClient: (info, callback) => {
        const origin = info.req.headers.origin;
        const referer = info.req.headers.referer;
        console.log(`[WS] Connection attempt - Origin: ${origin}, Referer: ${referer}`);

        // Allow requests without origin (same-origin, extensions, mobile apps, etc.)
        if (!origin) {
            console.log('[WS] ✅ Allowing connection with no origin');
            return callback(true);
        }

        // Local development - allow all
        if (process.env.NODE_ENV !== 'production') {
            console.log('[WS] ✅ Development mode - allowing all origins');
            return callback(true);
        }

        // Production - be permissive to allow various scenarios
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isVercel = origin.includes('vercel.app');
        const isRender = origin.includes('onrender.com');
        const isConfiguredFrontend = process.env.FRONTEND_URL && origin.includes(process.env.FRONTEND_URL.replace(/https?:\/\//, ''));

        console.log(`[WS] Checks - localhost: ${isLocalhost}, vercel: ${isVercel}, render: ${isRender}, configured: ${isConfiguredFrontend}`);

        if (isLocalhost || isVercel || isRender || isConfiguredFrontend) {
            console.log(`[WS] ✅ Allowing origin: ${origin}`);
            return callback(true);
        }

        console.warn(`[WS] ❌ Connection rejected from origin: ${origin}`);
        return callback(false, 403, 'Origin not allowed');
    }
});
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
        // Always allow no origin (for same-origin requests, health checks, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // Local development - allow all
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // Production - check origins
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isVercel = origin.includes('vercel.app');
        const isRender = origin.includes('onrender.com');
        const isConfiguredFrontend = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

        if (isLocalhost || isVercel || isRender || isConfiguredFrontend) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize WebSocket broadcast
setWebSocketServer(wss);

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Subscribe to worker heartbeats via Redis Pub/Sub
const redisSubscriber = new redis(process.env.REDIS_URL);

redisSubscriber.on('ready', () => {
    console.log('Redis Pub/Sub connection ready');
});

redisSubscriber.on('error', (err) => {
    console.error('Redis Pub/Sub connection error:', err);
});

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


