const express = require('express');
const app = express();
const ws = require('ws');
require('dotenv').config({ path: './.env' });
const db = require('./services/db');

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

const wss = new ws.Server({ port: 4000 });
wss.on('connection', (socket) => {
    console.log('Client connected');
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    db.connectToServer(function (err) {
        if (err) console.log(err);
    });
    console.log(`Distributed Task Queue app listening on port ${port}`);

})


