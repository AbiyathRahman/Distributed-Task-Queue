import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export function DeadLetterQueue() {
    const [deadLetterJobs, setDeadLetterJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDeadLetterJobs = async () => {
        try {
            // Fetch from the actual dead_letter collection
            const response = await axios.get(`${API_BASE}/jobs/dead-letter/list`);
            setDeadLetterJobs(response.data);
        } catch (error) {
            console.error('Error fetching dead letter jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeadLetterJobs();
    }, []);

    useEffect(() => {
        const interval = setInterval(fetchDeadLetterJobs, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRequeue = async (jobId) => {
        try {
            const response = await axios.post(`${API_BASE}/jobs/requeue/${jobId}`);
            alert('✅ Job requeued successfully and removed from dead letter queue!');
            fetchDeadLetterJobs();
        } catch (error) {
            alert(`❌ Error requeueing job: ${error.response?.data?.error || error.message}`);
        }
    };

    if (loading) {
        return <div style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)', padding: '1rem', borderRadius: '0.5rem' }}>Loading dead letter queue...</div>;
    }

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent-3)' }}>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>💀 Dead Letter Queue</h2>
            {deadLetterJobs.length === 0 ? (
                <p style={{ color: 'var(--muted)' }} className="font-mono text-sm">No failed jobs</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                        <thead style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>ID</th>
                                <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Type</th>
                                <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Error</th>
                                <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Attempts</th>
                                <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Failed At</th>
                                <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deadLetterJobs.map(job => (
                                <tr
                                    key={job._id}
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <td className="p-3 font-mono text-xs truncate w-40" style={{ color: 'var(--accent-3)' }}>{job.jobId}</td>
                                    <td className="p-3" style={{ color: 'var(--text)' }}>{job.jobType}</td>
                                    <td className="p-3 text-xs truncate max-w-xs" style={{ color: 'var(--accent-3)' }}>
                                        {job.reason || 'Unknown error'}
                                    </td>
                                    <td className="p-3" style={{ color: 'var(--text)' }}>
                                        {job.originalJob?.attempts || 0}/{job.originalJob?.maxAttempts || 3}
                                    </td>
                                    <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                                        {job.failedAt ? new Date(job.failedAt).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleRequeue(job._id)}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: 'var(--accent)',
                                                color: 'var(--bg)',
                                                fontSize: '0.75rem',
                                                borderRadius: '0.25rem',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.8)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                                        >
                                            Requeue
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
