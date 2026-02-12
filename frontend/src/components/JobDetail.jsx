import React from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// Helper to render object properties in readable format
const renderData = (data) => {
    if (!data || typeof data !== 'object') {
        return <p style={{ color: 'var(--text)' }}>{String(data)}</p>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.entries(data).map(([key, value]) => (
                <div key={key} style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {key}
                    </p>
                    <p style={{ color: 'var(--text)', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                </div>
            ))}
        </div>
    );
};

export function JobDetail({ jobId, onClose }) {
    const [job, setJob] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axios.get(`${API_BASE}/jobs/${jobId}`);
                setJob(response.data);
            } catch (error) {
                console.error('Error fetching job details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    if (!jobId) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--surface)',
                    padding: '2rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    borderLeft: '4px solid var(--accent)',
                    maxWidth: '700px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    color: 'var(--text)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
                    <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--accent)' }}>📋 Job Details</h2>
                    <button
                        onClick={onClose}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.8)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                        style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--bg)',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.875rem',
                        }}
                    >
                        ✕ Close
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--muted)', textAlign: 'center', fontSize: '1rem' }}>Loading job details...</p>
                ) : job ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* ID Section */}
                        <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem', borderLeft: '3px solid var(--accent-3)' }}>
                            <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>JOB ID</p>
                            <p className="font-mono text-sm" style={{ color: 'var(--accent)', wordBreak: 'break-all', fontSize: '0.875rem' }}>{job._id}</p>
                        </div>

                        {/* Key Info Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                            {/* Type */}
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>TYPE</p>
                                <p style={{ color: 'var(--text)', fontWeight: '600', fontSize: '0.95rem' }}>{job.type}</p>
                            </div>

                            {/* Priority */}
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>PRIORITY</p>
                                <p style={{
                                    color: job.priority === 'high' ? 'var(--accent-3)' : job.priority === 'medium' ? 'var(--warn)' : 'var(--accent)',
                                    fontWeight: '700',
                                    fontSize: '0.95rem'
                                }}>
                                    {job.priority.toUpperCase()}
                                </p>
                            </div>

                            {/* Status */}
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>STATUS</p>
                                <p style={{
                                    color: job.status === 'completed' ? 'var(--accent)' : job.status === 'running' ? 'var(--warn)' : job.status === 'failed' ? 'var(--accent-3)' : 'var(--accent-2)',
                                    fontWeight: '700',
                                    fontSize: '0.95rem'
                                }}>
                                    {job.status.toUpperCase()}
                                </p>
                            </div>
                        </div>

                        {/* Attempts */}
                        <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                            <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>ATTEMPTS</p>
                            <p style={{ color: 'var(--text)', fontWeight: '600', fontSize: '0.95rem' }}>
                                {job.attempts || 0} / {job.maxAttempts || 3}
                            </p>
                        </div>

                        {/* Timestamps */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>CREATED</p>
                                <p style={{ color: 'var(--text)', fontSize: '0.875rem' }}>
                                    {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>COMPLETED</p>
                                <p style={{ color: 'var(--text)', fontSize: '0.875rem' }}>
                                    {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Worker Info */}
                        {job.workerId && (
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem', borderLeft: '3px solid var(--accent)' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>WORKER</p>
                                <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.95rem' }}>{job.workerId}</p>
                            </div>
                        )}

                        {/* Payload */}
                        <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem' }}>
                            <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>PAYLOAD</p>
                            {renderData(job.payload)}
                        </div>

                        {/* Result */}
                        {job.result && (
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem', borderLeft: '3px solid var(--accent)' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.75rem', letterSpacing: '1px' }}>RESULT</p>
                                {renderData(job.result)}
                            </div>
                        )}

                        {/* Error */}
                        {job.error && (
                            <div style={{ backgroundColor: 'var(--surface-2)', padding: '1rem', borderRadius: '0.25rem', borderLeft: '3px solid var(--accent-3)' }}>
                                <p className="font-mono text-xs" style={{ color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>ERROR</p>
                                <p style={{ color: 'var(--accent-3)', fontSize: '0.95rem', lineHeight: '1.6' }}>{job.error}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={{ color: 'var(--accent-3)', textAlign: 'center' }}>Job not found</p>
                )}
            </div>
        </div>
    );
}
