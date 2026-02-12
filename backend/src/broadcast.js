let wss;

function setWebSocketServer(server) {
    wss = server;
}

function broadcast(event, data) {
    if (!wss) return;
    const msg = JSON.stringify({ event, data, ts: Date.now() });
    wss.clients.forEach(client => {
        if (client.readyState === require('ws').WebSocket.OPEN) client.send(msg);
    });
}

module.exports = { setWebSocketServer, broadcast };