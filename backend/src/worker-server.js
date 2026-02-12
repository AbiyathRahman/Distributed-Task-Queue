const express = require('express');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', type: 'worker' });
});

// Start HTTP server for health checks
app.listen(PORT, () => {
    console.log(`Worker health server listening on port ${PORT}`);
});

// Start actual worker logic in background
require('./worker');

console.log('Worker process started');
