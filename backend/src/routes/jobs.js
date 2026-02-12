const express = require('express');
const jobsRouter = express.Router();
const db = require('../services/db');
const queue = require('../services/queue');
const { broadcast } = require('../broadcast');

// POST /jobs - Create a new job
jobsRouter.post('/', async (req, res) => {
    try {
        const { type, payload, priority = 'medium' } = req.body;

        // Validate required fields
        if (!type || !payload) {
            return res.status(400).json({ error: 'Missing required fields: type, payload' });
        }

        // Create job document with all required fields
        const jobData = {
            type,
            payload,
            priority,
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: new Date()
        };

        const job = await db.createJob(jobData);

        // Only pass the job ID to Redis, not the whole job
        await queue.enqueue(job._id.toString(), priority);

        // Optional: broadcast via WebSocket here if you have it set up
        // broadcast('job_created', { id: job._id, type, priority, status: 'pending' });
        broadcast('job_created', {
            id: job._id,
            type,
            priority,
            status: 'pending'
        });

        res.status(201).json(job);

    } catch (err) {
        console.error('Error creating job:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /jobs - Get all jobs (with optional status filter)
jobsRouter.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const dbInstance = db.getDb();
        const collection = dbInstance.collection('jobs');

        // Build filter
        const filter = status ? { status } : {};

        // Get recent jobs (limit to 100, sorted by newest first)
        const jobs = await collection
            .find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        res.json(jobs);

    } catch (err) {
        console.error('Error fetching jobs:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /jobs/metrics - Get job metrics
jobsRouter.get('/metrics', async (req, res) => {
    try {
        const metrics = await db.getMetrics();
        res.json(metrics);
    } catch (err) {
        console.error('Error fetching metrics:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /jobs/queue-depths - Get current queue depths
jobsRouter.get('/queue-depths', async (req, res) => {
    try {
        const depths = await queue.getQueueDepths();

        // Ensure all values are present and are numbers
        const response = {
            high: depths.high || 0,
            medium: depths.medium || 0,
            low: depths.low || 0,
            total: (depths.high || 0) + (depths.medium || 0) + (depths.low || 0)
        };

        res.json(response);
    } catch (err) {
        console.error('Error fetching queue depths:', err);
        // Return empty but valid response instead of error
        res.json({ high: 0, medium: 0, low: 0, total: 0 });
    }
});

// GET /jobs/dead-letter - Get all jobs in dead letter queue
jobsRouter.get('/dead-letter/list', async (req, res) => {
    try {
        const dbInstance = db.getDb();
        const deadLetterCollection = dbInstance.collection('dead_letter');

        // Get dead letter jobs sorted by most recent first
        const deadLetterJobs = await deadLetterCollection
            .find({})
            .sort({ failedAt: -1 })
            .limit(100)
            .toArray();

        res.json(deadLetterJobs);
    } catch (err) {
        console.error('Error fetching dead letter jobs:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /jobs/requeue/:id - Requeue a job from dead letter queue
jobsRouter.post('/requeue/:id', async (req, res) => {
    try {
        const newJob = await db.requeueJob(req.params.id);

        // Enqueue the new job
        await queue.enqueue(newJob._id.toString(), newJob.priority);

        // Broadcast job created event
        broadcast('job_created', {
            id: newJob._id,
            type: newJob.type,
            priority: newJob.priority,
            status: 'pending'
        });

        res.json({ message: 'Job requeued successfully', job: newJob });
    } catch (err) {
        console.error('Error requeueing job:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /jobs/:id - Get a specific job by ID
jobsRouter.get('/:id', async (req, res) => {
    try {
        const job = await db.getJob(req.params.id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json(job);

    } catch (err) {
        console.error('Error fetching job:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = jobsRouter;