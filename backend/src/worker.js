const handlers = require('./services/handler');
const { getJob, updateJob, moveToDeadLetter } = require('./services/db');
const { dequeue, enqueue } = require('./services/queue');
const { connect } = require('./routes/jobs');

const WORKER_ID = `worker-${process.pid}`;

async function processJob(jobId) {
    const job = await getJob(jobId);
    if (!job) {
        console.error(`Job ${jobId} not found in DB`);
        return;
    }

    await updateJob(jobId, { status: 'running', workerId: WORKER_ID, startedAt: new Date() });
    try {
        const handler = handlers[job.type];
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
    }
}

async function workerLoop() {
    await connect(); // Ensure DB is connected before starting
    console.log(`${WORKER_ID} started`);
    while (true) {
        const item = await dequeue();
        if (item) await processJob(item.jobId);
    }
}

workerLoop();
