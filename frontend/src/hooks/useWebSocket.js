import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url, apiBaseUrl) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        const checkServerAndConnect = async () => {
            try {
                // First, check if the HTTP server is awake
                console.log('Checking if server is awake...');
                const response = await fetch(`${apiBaseUrl}/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(30000) // 30 second timeout
                });

                if (!response.ok) {
                    throw new Error('Server health check failed');
                }

                console.log('Server is awake, connecting WebSocket...');

                // Server is awake, now connect WebSocket
                connectWS();

            } catch (error) {
                console.error('Server not ready yet, retrying in 5s...', error);
                // Server not ready, retry in 5 seconds
                reconnectTimeoutRef.current = setTimeout(checkServerAndConnect, 5000);
            }
        };

        const connectWS = () => {
            try {
                const ws = new WebSocket(url);

                ws.onopen = () => {
                    setConnected(true);
                    console.log('✓ WebSocket connected');
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        setMessages(prev => [...prev, data]);
                    } catch (e) {
                        console.error('Failed to parse WebSocket message:', e);
                    }
                };

                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setConnected(false);
                };

                ws.onclose = () => {
                    setConnected(false);
                    console.log('WebSocket disconnected, checking server...');
                    // Check if server is still alive before reconnecting
                    reconnectTimeoutRef.current = setTimeout(checkServerAndConnect, 5000);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reconnectTimeoutRef.current = setTimeout(checkServerAndConnect, 5000);
            }
        };

        // Start by checking if server is ready
        checkServerAndConnect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [url, apiBaseUrl]);

    return { messages, connected };
}