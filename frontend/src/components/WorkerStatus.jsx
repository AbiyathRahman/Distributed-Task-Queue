import { useEffect, useState } from 'react';

export function WorkerStatus({ wsMessages }) {
    const [workers, setWorkers] = useState({});
    const [loading, setLoading] = useState(false);

    // Listen to WebSocket messages for worker heartbeats
    useEffect(() => {
        if (!wsMessages || wsMessages.length === 0) return;

        wsMessages.forEach(msg => {
            if (msg.event === 'worker_heartbeat') {
                const { data } = msg;
                setWorkers(prev => ({
                    ...prev,
                    [data.workerId]: {
                        ...data,
                        lastSeen: new Date().getTime()
                    }
                }));
            }
        });
    }, [wsMessages]);

    // Remove workers that haven't sent a heartbeat in 15+ seconds (likely crashed)
    useEffect(() => {
        const interval = setInterval(() => {
            setWorkers(prev => {
                const now = new Date().getTime();
                const filtered = {};

                Object.entries(prev).forEach(([workerId, worker]) => {
                    const timeSinceLastHeartbeat = now - (worker.lastSeen || 0);
                    if (timeSinceLastHeartbeat < 15000) { // 15 second timeout
                        filtered[workerId] = worker;
                    }
                });

                return filtered;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const workerList = Object.values(workers);

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>⚙️ Workers ({workerList.length})</h2>
            <div className="space-y-2">
                {workerList.length === 0 ? (
                    <p style={{ color: 'var(--muted)' }} className="font-mono text-sm">No active workers. Start one with: <code style={{ backgroundColor: 'var(--surface-2)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: 'var(--accent-3)' }}>node src/worker.js</code></p>
                ) : (
                    workerList.map(worker => (
                        <div
                            key={worker.workerId}
                            style={{
                                backgroundColor: 'var(--surface-2)',
                                padding: '1rem',
                                borderRadius: '0.25rem',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>{worker.workerId}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>|</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                                    {worker.status === 'idle' ? (
                                        <span>⏸️ <span style={{ color: 'var(--muted)' }}>Idle</span></span>
                                    ) : (
                                        <span>🔄 <span style={{ color: 'var(--warn)' }}>Processing {worker.currentJobId?.substring(0, 8)}...</span></span>
                                    )}
                                </span>
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: 'var(--accent)',
                                backgroundColor: 'rgba(0, 255, 136, 0.12)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.25rem',
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(0, 255, 136, 0.2)',
                            }}>
                                ✅ Healthy
                            </span>
                        </div>
                    ))
                )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1rem' }} className="font-mono">
                💡 Workers broadcast their status every 5 seconds. Inactive workers disappear after 15 seconds.
            </p>
        </div>
    );
}
