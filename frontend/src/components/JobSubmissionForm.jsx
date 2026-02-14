import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const JOB_TYPES = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'resize_image', label: 'Resize Image' },
    { value: 'generate_report', label: 'Generate Report' },
    { value: 'process_data', label: 'Process Data' },
];

const PRIORITIES = ['high', 'medium', 'low'];

export function JobSubmissionForm() {
    const [jobType, setJobType] = useState('send_email');
    const [priority, setPriority] = useState('medium');
    const [payload, setPayload] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const getPayloadFields = () => {
        switch (jobType) {
            case 'send_email':
                return [
                    { key: 'to', label: 'Email To', placeholder: 'user@example.com' },
                    { key: 'subject', label: 'Subject', placeholder: 'Email subject' },
                ];
            case 'resize_image':
                return [
                    { key: 'width', label: 'Width', placeholder: '800', type: 'number' },
                    { key: 'height', label: 'Height', placeholder: '600', type: 'number' },
                ];
            case 'generate_report':
                return [
                    { key: 'title', label: 'Report Title', placeholder: 'Monthly Report' },
                    { key: 'reportType', label: 'Report Type', placeholder: 'PDF' },
                ];
            case 'process_data':
                return [
                    { key: 'action', label: 'Action', placeholder: 'transform' },
                    { key: 'records', label: 'Number of Records', placeholder: '100', type: 'number' },
                ];
            default:
                return [];
        }
    };

    const handlePayloadChange = (key, value) => {
        setPayload(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post(`${API_BASE}/jobs`, {
                type: jobType,
                priority,
                payload,
            });

            setMessage(`✅ Job created: ${response.data._id}`);
            setPayload({});
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>📋 Submit New Job</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block font-display font-semibold mb-2 text-sm" style={{ color: 'var(--text)' }}>Job Type</label>
                        <select
                            value={jobType}
                            onChange={(e) => setJobType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                backgroundColor: 'var(--surface-2)',
                                color: 'var(--text)',
                                border: '2px solid var(--accent)',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                        >
                            {JOB_TYPES.map(type => (
                                <option key={type.value} value={type.value} style={{ backgroundColor: '#1a1a26', color: '#e8e8f0' }}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-display font-semibold mb-2 text-sm" style={{ color: 'var(--text)' }}>Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                backgroundColor: 'var(--surface-2)',
                                color: 'var(--text)',
                                border: '2px solid var(--accent)',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                        >
                            {PRIORITIES.map(p => (
                                <option key={p} value={p} style={{ backgroundColor: '#1a1a26', color: '#e8e8f0' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {getPayloadFields().map(field => (
                        <div key={field.key}>
                            <label className="block font-display font-semibold mb-2 text-sm" style={{ color: 'var(--text)' }}>{field.label}</label>
                            <input
                                type={field.type || 'text'}
                                placeholder={field.placeholder}
                                value={payload[field.key] || ''}
                                onChange={(e) => handlePayloadChange(field.key, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    backgroundColor: 'var(--surface-2)',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.25rem',
                                }}
                                className="placeholder-muted"
                            />
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: loading ? 'var(--muted)' : 'var(--accent)',
                        color: loading ? 'var(--surface)' : 'var(--bg)',
                        borderRadius: '0.25rem',
                        fontWeight: '600',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? 'Submitting...' : 'Submit Job'}
                </button>
            </form>

            {message && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--surface-2)',
                    borderLeft: message.startsWith('✅') ? '3px solid var(--accent)' : '3px solid var(--accent-3)',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-mono)',
                }}>
                    {message}
                </div>
            )}
        </div>
    );
}
