import { useState, useEffect, useRef } from 'react';

export function useWebSocket(url) {
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    useEffect(() => {
        const connectWS = () => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                return; // Already connected
            }

            try {
                const ws = new WebSocket(url);

                ws.onopen = () => {
                    setConnected(true);
                    reconnectAttemptsRef.current = 0; // Reset on successful connection
                    console.log('✅ WebSocket connected to', url);
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
                    console.warn(`⚠️ WebSocket error (attempt ${reconnectAttemptsRef.current + 1}):`, error.type || 'Unknown error');
                    setConnected(false);
                };

                ws.onclose = () => {
                    setConnected(false);
                    // Use exponential backoff: 2s, 4s, 8s, 16s, 32s, then cap at 32s
                    const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current), 32000);
                    reconnectAttemptsRef.current++;

                    console.log(`🔄 WebSocket disconnected. Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttemptsRef.current})`);
                    reconnectTimeoutRef.current = setTimeout(connectWS, delay);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current), 32000);
                reconnectAttemptsRef.current++;
                reconnectTimeoutRef.current = setTimeout(connectWS, delay);
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
