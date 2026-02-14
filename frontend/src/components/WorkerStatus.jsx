import { useMemo } from 'react';

export function WorkerStatus({ workers = [] }) {
    const workerList = useMemo(() => {
        if (Array.isArray(workers)) {
            return workers;
        }
        return Object.values(workers || {});
    }, [workers]);

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>⚙️ Workers ({workerList.length})</h2>
            <div className="space-y-2">
                {workerList.length === 0 ? (
                    <p style={{ color: 'var(--muted)' }} className="font-mono text-sm">No active workers. Start one with: <code style={{ backgroundColor: 'var(--surface-2)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: 'var(--accent-3)' }}>node src/worker.js</code></p>
                ) : (
                    workerList.map(worker => (
                        <div
                            key={worker.id}
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
                                <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)' }}>{worker.id}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>|</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
                                    {worker.currentJob ? (
                                        <span>🔄 <span style={{ color: 'var(--warn)' }}>
                                            {worker.currentJob.type}
                                            {' '}
                                            ({worker.currentJob.id?.substring(0, 8)}...)
                                        </span></span>
                                    ) : (
                                        <span>⏸️ <span style={{ color: 'var(--muted)' }}>Idle</span></span>
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
                                ✅ Active
                            </span>
                        </div>
                    ))
                )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1rem' }} className="font-mono">
                💡 Shows workers currently processing jobs. Updates every 2 seconds.
            </p>
        </div>
    );
}
