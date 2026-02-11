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
    const [high, medium, low] = await Promise.all([
        client.llen(QUEUES.high),
        client.llen(QUEUES.medium),
        client.llen(QUEUES.low)
    ]);
    return { high, medium, low, total: high + medium + low };
}

module.exports = {
    enqueue,
    dequeue,
    getQueueDepths
};
