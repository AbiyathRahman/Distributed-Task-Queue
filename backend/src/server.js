const express = require('express');
const app = express();
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server });
require('dotenv').config({ path: './.env' });
const db = require('./services/db');
const jobsRouter = require('./routes/jobs');
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors(
    {
        origin: "http://localhost:5173",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        optionsSuccessStatus: 204,
        allowedHeaders: ["Content-Type", "Authorization"]
    }
));

app.use(express.json());

function broadcast(event, data) {
    const msg = JSON.stringify({ event, data, ts: Date.now() });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
}

// Poll queue depths + broadcast every 2 seconds
setInterval(async () => {
    const depths = await getQueueDepths();
    broadcast('queue_update', depths);
}, 2000);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    db.connectToServer(function (err) {
        if (err) console.log(err);
    });
    console.log(`Distributed Task Queue app listening on port ${port}`);

});
app.use('/jobs', jobsRouter);
module.exports = { broadcast };


