import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export function QueueDepth({ queueUpdated }) {
    const [depths, setDepths] = useState({
        high: 0,
        medium: 0,
        low: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchQueueDepths = async () => {
        try {
            const response = await axios.get(`${API_BASE}/jobs/queue-depths`);

            // Ensure all values are numbers
            const data = {
                high: parseInt(response.data.high) || 0,
                medium: parseInt(response.data.medium) || 0,
                low: parseInt(response.data.low) || 0,
            };

            setDepths(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching queue depths:', error);
            setError(error.message);
            // Set defaults on error
            setDepths({ high: 0, medium: 0, low: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueDepths();
    }, [queueUpdated]);

    useEffect(() => {
        const interval = setInterval(fetchQueueDepths, 2000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="p-4 bg-gray-100 rounded">Loading queue depths...</div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 rounded text-red-700">Error: {error}</div>;
    }

    const chartData = [
        { name: 'High', count: depths.high || 0 },
        { name: 'Medium', count: depths.medium || 0 },
        { name: 'Low', count: depths.low || 0 },
    ];

    const maxDepth = Math.max(depths.high || 0, depths.medium || 0, depths.low || 0, 1);

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent-2)' }}>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>📈 Queue Depth</h2>

            <div style={{ width: '100%', height: '300px' }} className="mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="var(--muted)" style={{ fontSize: '12px' }} />
                        <YAxis stroke="var(--muted)" style={{ fontSize: '12px' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.25rem', color: 'var(--text)' }}
                            labelStyle={{ color: 'var(--text)' }}
                        />
                        <Bar dataKey="count" fill="var(--accent)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2" style={{ background: 'var(--border)', padding: '2px', borderRadius: '0.25rem' }}>
                <div style={{ backgroundColor: 'var(--surface)', padding: '1rem' }}>
                    <div className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>High Priority</div>
                    <div className="text-3xl font-bold mb-2" style={{ color: 'var(--accent-3)' }}>{depths.high || 0}</div>
                    <div style={{ width: '100%', backgroundColor: 'var(--surface-2)', borderRadius: '0.125rem', height: '0.5rem' }}>
                        <div
                            style={{
                                backgroundColor: 'var(--accent-3)',
                                height: '0.5rem',
                                borderRadius: '0.125rem',
                                width: `${((depths.high || 0) / maxDepth) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}
                        ></div>
                    </div>
                </div>
                <div style={{ backgroundColor: 'var(--surface)', padding: '1rem' }}>
                    <div className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>Medium Priority</div>
                    <div className="text-3xl font-bold mb-2" style={{ color: 'var(--warn)' }}>{depths.medium || 0}</div>
                    <div style={{ width: '100%', backgroundColor: 'var(--surface-2)', borderRadius: '0.125rem', height: '0.5rem' }}>
                        <div
                            style={{
                                backgroundColor: 'var(--warn)',
                                height: '0.5rem',
                                borderRadius: '0.125rem',
                                width: `${((depths.medium || 0) / maxDepth) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}
                        ></div>
                    </div>
                </div>
                <div style={{ backgroundColor: 'var(--surface)', padding: '1rem' }}>
                    <div className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>Low Priority</div>
                    <div className="text-3xl font-bold mb-2" style={{ color: 'var(--accent)' }}>{depths.low || 0}</div>
                    <div style={{ width: '100%', backgroundColor: 'var(--surface-2)', borderRadius: '0.125rem', height: '0.5rem' }}>
                        <div
                            style={{
                                backgroundColor: 'var(--accent)',
                                height: '0.5rem',
                                borderRadius: '0.125rem',
                                width: `${((depths.low || 0) / maxDepth) * 100}%`,
                                transition: 'width 0.3s ease'
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
