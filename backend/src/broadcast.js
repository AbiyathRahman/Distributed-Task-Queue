let wss;

function setWebSocketServer(server) {
    wss = server;
}

function broadcast(event, data) {
    if (!wss || !wss.clients) return;
    const msg = JSON.stringify({ event, data, ts: Date.now() });
    try {
        wss.clients.forEach(client => {
            if (client.readyState === require('ws').WebSocket.OPEN) {
                client.send(msg);
            }
        });
    } catch (error) {
        console.error('Broadcast error:', error);
    }
}

module.exports = { setWebSocketServer, broadcast };