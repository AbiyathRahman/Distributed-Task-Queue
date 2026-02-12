const path = require('path');
const fs = require('fs');

// Load .env file if it exists (for local development)
const envPath = path.join(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const uri = process.env.ATLAS_URI;
let _db;
let _client;

module.exports = {
    connectToServer: function (callback) {
        console.log("Attempting to Connect to MongoDB...");

        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        async function run() {
            try {
                await client.connect();
                await client.db("admin").command({ ping: 1 });
                console.log("✓ MongoDB connection successful");

                _db = client.db("DistributedTaskQueue");
                _client = client;

                callback(); // ← YOU WERE MISSING THIS

            } catch (err) {
                console.error("MongoDB connection failed:", err);
                callback(err); // ← PASS THE ERROR TO CALLBACK
            }
        }

        run();
    },

    getDb: function () {
        return _db;
    },

    createJob: async function (data) {
        const collection = _db.collection("jobs");
        const result = await collection.insertOne(data);
        return { ...data, _id: result.insertedId }; // Return the full job with ID
    },

    getJob: async function (jobId) {
        const collection = _db.collection("jobs");
        // Convert string ID to ObjectId if needed
        const id = typeof jobId === 'string' ? new ObjectId(jobId) : jobId;
        const job = await collection.findOne({ _id: id });
        return job;
    },

    updateJob: async function (jobId, updateData) {
        const collection = _db.collection("jobs");
        const id = typeof jobId === 'string' ? new ObjectId(jobId) : jobId;
        const result = await collection.updateOne(
            { _id: id },
            { $set: updateData }
        );
        return result;
    },

    moveToDeadLetter: async function (jobId, reason) {
        const id = typeof jobId === 'string' ? new ObjectId(jobId) : jobId;

        // Get the original job from jobs collection
        const jobsCollection = _db.collection("jobs");
        const job = await jobsCollection.findOne({ _id: id });

        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        // Create a dead letter record
        const deadLetterCollection = _db.collection("dead_letter");
        await deadLetterCollection.insertOne({
            jobId: job._id,
            jobType: job.type,
            payload: job.payload,
            reason: reason,
            failedAt: new Date(),
            originalJob: job // Store full job for debugging
        });

        // Job stays in jobs collection with status 'failed'
        // (This should already be set by the worker before calling this)
    },

    getMetrics: async function () {
        const jobsCollection = _db.collection("jobs");
        const deadLetterCollection = _db.collection("dead_letter");

        const totalJobs = await jobsCollection.countDocuments();
        const completedJobs = await jobsCollection.countDocuments({ status: 'completed' });
        const failedJobs = await jobsCollection.countDocuments({ status: 'failed' });
        const pendingJobs = await jobsCollection.countDocuments({ status: 'pending' });
        const runningJobs = await jobsCollection.countDocuments({ status: 'running' });
        const deadLetterCount = await deadLetterCollection.countDocuments();

        return {
            totalJobs,
            completedJobs,
            failedJobs,
            pendingJobs,
            runningJobs,
            deadLetterCount
        };
    },

    requeueJob: async function (deadLetterJobId) {
        const deadLetterCollection = _db.collection("dead_letter");
        const jobsCollection = _db.collection("jobs");

        // Find the dead letter entry
        const id = typeof deadLetterJobId === 'string' ? new ObjectId(deadLetterJobId) : deadLetterJobId;
        const deadLetterEntry = await deadLetterCollection.findOne({ jobId: id });

        if (!deadLetterEntry) {
            throw new Error(`Job not found in dead letter queue: ${deadLetterJobId}`);
        }

        // Create a new job with the same type and payload, reset attempts
        const newJobData = {
            type: deadLetterEntry.jobType,
            payload: deadLetterEntry.payload,
            priority: deadLetterEntry.priority || 'medium',
            status: 'pending',
            attempts: 0,
            maxAttempts: deadLetterEntry.originalJob?.maxAttempts || 3,
            createdAt: new Date(),
            requeuedFrom: deadLetterJobId // Track that this was requeued
        };

        const result = await jobsCollection.insertOne(newJobData);

        // Remove from dead letter queue
        await deadLetterCollection.deleteOne({ jobId: id });

        return { ...newJobData, _id: result.insertedId };
    },

    close: async function () {
        if (_client) {
            await _client.close();
            console.log("MongoDB connection closed");
        }
    }
};