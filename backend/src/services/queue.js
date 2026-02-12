const path = require('path');
const fs = require('fs');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);

const QUEUES = {
    high: 'queue:high',
    medium: 'queue:medium',
    low: 'queue:low'
}

// Enqueue - LPUSH adds to the left, workers BRPOP from right
async function enqueue(jobId, priority = 'medium') {
    const queue = QUEUES[priority] || QUEUES.medium;
    await client.lpush(queue, jobId);
}

// Dequeue - BRPOP blocks until an item is available
async function dequeue(timeout = 5) {
    const result = await client.brpop(QUEUES.high, QUEUES.medium, QUEUES.low, timeout);
    if (!result) return null; // Timeout
    return { queue: result[0], jobId: result[1] };
}

async function getQueueDepths() {
    try {
        const [high, medium, low] = await Promise.all([
            client.llen(QUEUES.high),
            client.llen(QUEUES.medium),
            client.llen(QUEUES.low)
        ]);

        const depths = {
            high: parseInt(high) || 0,
            medium: parseInt(medium) || 0,
            low: parseInt(low) || 0
        };
        depths.total = depths.high + depths.medium + depths.low;

        return depths;
    } catch (error) {
        console.error('Error getting queue depths from Redis:', error);
        return { high: 0, medium: 0, low: 0, total: 0 };
    }
}

module.exports = {
    enqueue,
    dequeue,
    getQueueDepths
};
