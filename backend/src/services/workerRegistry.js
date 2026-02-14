const path = require('path');
const fs = require('fs');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const redis = require('ioredis');

// In-memory registry of active workers
const workers = new Map();

// Create a subscriber to listen for worker heartbeats
const redisSubscriber = new redis(process.env.REDIS_URL);
const HEARTBEAT_CHANNEL = 'worker-heartbeats';
const HEARTBEAT_TIMEOUT = 10000; // 10 seconds - if no heartbeat, mark as inactive

/**
 * Register or update a worker from heartbeat data
 */
function registerWorkerHeartbeat(heartbeat) {
    const { workerId, status, currentJobId, timestamp } = heartbeat;

    workers.set(workerId, {
        id: workerId,
        status,
        currentJobId,
        lastSeen: timestamp || Date.now()
    });
}

/**
 * Clean up workers that haven't sent heartbeats recently
 */
function cleanupInactiveWorkers() {
    const now = Date.now();
    for (const [workerId, workerData] of workers.entries()) {
        if (now - workerData.lastSeen > HEARTBEAT_TIMEOUT) {
            workers.delete(workerId);
        }
    }
}

/**
 * Get all active workers
 */
function getActiveWorkers() {
    cleanupInactiveWorkers();
    return Array.from(workers.values()).map(worker => ({
        id: worker.id,
        status: worker.status,
        currentJobId: worker.currentJobId,
        lastSeen: worker.lastSeen
    }));
}

/**
 * Initialize the heartbeat listener
 */
function initializeHeartbeatListener() {
    redisSubscriber.on('message', (channel, message) => {
        if (channel === HEARTBEAT_CHANNEL) {
            try {
                const heartbeat = JSON.parse(message);
                registerWorkerHeartbeat(heartbeat);
            } catch (error) {
                console.error('Error parsing heartbeat message:', error);
            }
        }
    });

    redisSubscriber.subscribe(HEARTBEAT_CHANNEL, (err) => {
        if (err) {
            console.error('Failed to subscribe to heartbeat channel:', err);
        } else {
            console.log(`Worker registry listening on channel: ${HEARTBEAT_CHANNEL}`);
        }
    });

    // Cleanup inactive workers every 5 seconds
    setInterval(cleanupInactiveWorkers, 5000);
}

module.exports = {
    initializeHeartbeatListener,
    getActiveWorkers,
    registerWorkerHeartbeat
};
