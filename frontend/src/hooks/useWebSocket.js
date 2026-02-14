import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        const connectWS = () => {
            try {
                const ws = new WebSocket(url);

                ws.onopen = () => {
                    setConnected(true);
                    console.log('WebSocket connected');
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
                    console.log('WebSocket disconnected, attempting to reconnect in 2s...');
                    // Reconnect after 2 seconds
                    reconnectTimeoutRef.current = setTimeout(connectWS, 2000);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reconnectTimeoutRef.current = setTimeout(connectWS, 2000);
            }
        };

        connectWS();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [url]);

    return { messages, connected };
}
