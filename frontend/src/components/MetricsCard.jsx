import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export function MetricsCard() {
    const [metrics, setMetrics] = useState({
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        pendingJobs: 0,
        runningJobs: 0,
        deadLetterCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await axios.get(`${API_BASE}/jobs/metrics`);
                setMetrics(response.data);
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)', padding: '1rem', borderRadius: '0.5rem' }}>Loading metrics...</div>;
    }

    const metricCards = [
        { label: 'Total Jobs', value: metrics.totalJobs, color: 'var(--accent-2)' },
        { label: 'Completed', value: metrics.completedJobs, color: 'var(--accent)' },
        { label: 'Running', value: metrics.runningJobs, color: 'var(--warn)' },
        { label: 'Pending', value: metrics.pendingJobs, color: 'var(--accent-3)' },
        { label: 'Failed', value: metrics.failedJobs, color: 'var(--accent-3)' },
        { label: 'Dead Letter', value: metrics.deadLetterCount, color: 'var(--accent-2)' },
    ];

    return (
        <div className="grid grid-cols-6 gap-2" style={{ background: 'var(--border)', padding: '2px', borderRadius: '0.5rem' }}>
            {metricCards.map((card, idx) => (
                <div
                    key={idx}
                    style={{
                        backgroundColor: 'var(--surface)',
                        padding: '1rem',
                        borderLeft: `3px solid ${card.color}`,
                    }}
                >
                    <div className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{card.label}</div>
                    <div className="text-2xl font-bold mt-2" style={{ color: card.color }}>{card.value}</div>
                </div>
            ))}
        </div>
    );
}
