const express = require('express');
const jobsRouter = express.Router();
const db = require('../services/db');
const queue = require('../services/queue');
const { broadcast } = require('../server');

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

// GET /jobs/queue-depths - Get current queue depths
jobsRouter.get('/queue-depths', async (req, res) => {
    try {
        const depths = await queue.getQueueDepths();
        res.json(depths);
    } catch (err) {
        console.error('Error fetching queue depths:', err);
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