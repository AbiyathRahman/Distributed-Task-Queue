import { useEffect, useState } from 'react';
import axios from 'axios';
import { JobDetail } from './JobDetail';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const getStatusColor = (status) => {
    switch (status) {
        case 'completed':
            return { bg: 'rgba(0, 255, 136, 0.12)', color: 'var(--accent)' };
        case 'running':
            return { bg: 'rgba(255, 209, 102, 0.12)', color: 'var(--warn)' };
        case 'failed':
            return { bg: 'rgba(255, 107, 53, 0.12)', color: 'var(--accent-3)' };
        case 'pending':
            return { bg: 'rgba(123, 97, 255, 0.12)', color: 'var(--accent-2)' };
        default:
            return { bg: 'rgba(107, 107, 138, 0.12)', color: 'var(--muted)' };
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'completed':
            return '✅';
        case 'running':
            return '🔄';
        case 'failed':
            return '❌';
        case 'pending':
            return '⏳';
        default:
            return '❓';
    }
};

export function JobsList({ jobUpdated }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJobId, setSelectedJobId] = useState(null);

    const fetchJobs = async () => {
        try {
            const response = await axios.get(`${API_BASE}/jobs`);
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [jobUpdated]);

    useEffect(() => {
        const interval = setInterval(fetchJobs, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)', padding: '1rem', borderRadius: '0.5rem' }}>Loading jobs...</div>;
    }

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent-2)' }}>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>🔄 Recent Jobs</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                    <thead style={{ backgroundColor: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>ID</th>
                            <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Type</th>
                            <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Status</th>
                            <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Priority</th>
                            <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Created</th>
                            <th className="p-3 text-left" style={{ color: 'var(--muted)', fontSize: '11px', letterSpacing: '1px' }}>Attempts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-4 text-center" style={{ color: 'var(--muted)' }}>No jobs yet</td>
                            </tr>
                        ) : (
                            jobs.map(job => {
                                const statusColors = getStatusColor(job.status);
                                const priorityColor = job.priority === 'high' ? 'var(--accent-3)' :
                                    job.priority === 'medium' ? 'var(--warn)' : 'var(--accent)';
                                return (
                                    <tr
                                        key={job._id}
                                        onClick={() => setSelectedJobId(job._id)}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-2)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td className="p-3 font-mono text-xs truncate w-40" style={{ color: 'var(--accent-3)' }}>{job._id}</td>
                                        <td className="p-3" style={{ color: 'var(--text)' }}>{job.type}</td>
                                        <td className="p-3" style={{ backgroundColor: statusColors.bg, color: statusColors.color, borderRadius: '0.25rem', width: 'fit-content' }}>
                                            {getStatusIcon(job.status)} {job.status}
                                        </td>
                                        <td className="p-3">
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                borderRadius: '0.25rem',
                                                backgroundColor: `${priorityColor}22`,
                                                color: priorityColor,
                                                border: `1px solid ${priorityColor}44`,
                                            }}>
                                                {job.priority}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                                            {new Date(job.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-3" style={{ color: 'var(--text)' }}>
                                            {job.attempts || 0}/{job.maxAttempts || 3}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <JobDetail jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
        </div>
    );
}
