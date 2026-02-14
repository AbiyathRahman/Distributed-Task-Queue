import { useState, useEffect, useRef } from 'react';

export function usePolling(apiBase, pollIntervalMs = 2000) {
    const [queueDepths, setQueueDepths] = useState({});
    const pollIntervalRef = useRef(null);

    const fetchData = async () => {
        try {
            // Fetch queue depths
            const depthResponse = await fetch(`${apiBase}/jobs/queue-depths`);
            if (depthResponse.ok) {
                const depths = await depthResponse.json();
                setQueueDepths(depths);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Set up polling interval
        pollIntervalRef.current = setInterval(fetchData, pollIntervalMs);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [apiBase, pollIntervalMs]);

    return { queueDepths };
}
