const path = require('path');
const fs = require('fs');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const redis = require('ioredis');

const redisClient = new redis(process.env.REDIS_URL);
const HEARTBEAT_CHANNEL = 'worker-heartbeats';

let currentWorkerId = null;
let currentJobId = null;

function setWorkerId(workerId) {
    currentWorkerId = workerId;
}

function setCurrentJob(jobId) {
    currentJobId = jobId;
}

function clearCurrentJob() {
    currentJobId = null;
}

async function sendHeartbeat() {
    if (!currentWorkerId) return;

    const heartbeat = {
        workerId: currentWorkerId,
        status: currentJobId ? 'processing' : 'idle',
        currentJobId: currentJobId || null,
        timestamp: Date.now()
    };

    try {
        await redisClient.publish(HEARTBEAT_CHANNEL, JSON.stringify(heartbeat));
    } catch (error) {
        console.error('Error sending heartbeat:', error);
    }
}

function startHeartbeat(workerId) {
    setWorkerId(workerId);

    // Send immediate heartbeat
    sendHeartbeat();

    // Send heartbeat every 5 seconds
    const interval = setInterval(sendHeartbeat, 5000);

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        clearInterval(interval);
        redisClient.disconnect();
    });

    process.on('SIGINT', () => {
        clearInterval(interval);
        redisClient.disconnect();
    });

    return { setCurrentJob, clearCurrentJob };
}

module.exports = {
    startHeartbeat,
    setCurrentJob: (jobId) => setCurrentJob(jobId),
    clearCurrentJob
};
