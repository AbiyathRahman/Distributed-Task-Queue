const path = require('path');
const fs = require('fs');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const { jobHandlers } = require('./services/jobHandler');
const { getJob, updateJob, moveToDeadLetter, connectToServer } = require('./services/db');
const { dequeue, enqueue } = require('./services/queue');
const { startHeartbeat, setCurrentJob, clearCurrentJob } = require('./services/workerHeartbeat');

const WORKER_ID = process.env.WORKER_ID || `worker-${process.pid}`;

async function processJob(jobId) {
    const job = await getJob(jobId);
    if (!job) {
        console.error(`Job ${jobId} not found in DB`);
        clearCurrentJob();
        return;
    }

    setCurrentJob(jobId);
    await updateJob(jobId, { status: 'running', workerId: WORKER_ID, startedAt: new Date() });
    try {
        const handler = jobHandlers[job.type];
        if (!handler) throw new Error(`No handler for job type ${job.type}`);
        const result = await handler(job.payload);
        await updateJob(jobId, { status: 'completed', completedAt: new Date(), result });
    } catch (error) {
        const attempts = job.attempts + 1;
        if (attempts >= job.maxAttempts) {
            await updateJob(jobId, { status: 'failed', attempts, lastError: error.message });
            await moveToDeadLetter(jobId, error.message);
        } else {
            const delay = Math.pow(2, attempts) * 1000;
            await updateJob(jobId, { status: 'pending', attempts, lastError: error.message });
            setTimeout(() => {
                enqueue(jobId, job.priority);
            }, delay);
        }
    } finally {
        clearCurrentJob();
    }
}

async function workerLoop() {
    await new Promise((resolve, reject) => {
        connectToServer((err) => {
            if (err) {
                console.error('MongoDB connection failed:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });

    // Start sending heartbeats
    startHeartbeat(WORKER_ID);
    console.log(`${WORKER_ID} started`);

    while (true) {
        const item = await dequeue();
        if (item) await processJob(item.jobId);
    }
}

workerLoop();
