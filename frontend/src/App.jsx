import { useState, useEffect } from 'react';
import { MetricsCard } from './components/MetricsCard';
import { JobSubmissionForm } from './components/JobSubmissionForm';
import { JobsList } from './components/JobsList';
import { QueueDepth } from './components/QueueDepth';
import { WorkerStatus } from './components/WorkerStatus';
import { DeadLetterQueue } from './components/DeadLetterQueue';
import { useWebSocket } from './hooks/useWebSocket';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function App() {
    // Pass API_BASE so hook can check health endpoint first
    const { messages, connected } = useWebSocket(WS_URL, API_BASE);
    const [jobCreated, setJobCreated] = useState(0);
    const [queueUpdated, setQueueUpdated] = useState(0);


    // Listen for WebSocket events and update state
    useEffect(() => {
        if (!messages || messages.length === 0) return;
        messages.forEach(msg => {
            if (msg.event === 'job_created') {
                setJobCreated(prev => prev + 1);
            }
            if (msg.event === 'queue_update') {
                setQueueUpdated(prev => prev + 1);
            }
        });
    }, [messages]);

    return (
        <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }} className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold mb-2" style={{ color: 'var(--text)' }}>
                            📊 Distributed Task Queue
                        </h1>
                        <p style={{ color: 'var(--muted)' }} className="font-mono text-sm">
                            Real-time job processing monitoring and control
                        </p>
                    </div>
                    <div style={{
                        backgroundColor: connected ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 107, 53, 0.12)',
                        borderColor: connected ? 'var(--accent)' : 'var(--accent-3)',
                        color: connected ? 'var(--accent)' : 'var(--accent-3)',
                    }} className="px-4 py-2 rounded text-sm font-semibold border font-mono">
                        {connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </div>
                </div>

                {/* Metrics */}
                <div className="mb-8">
                    <MetricsCard />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <JobSubmissionForm onJobCreated={() => setJobCreated(prev => prev + 1)} />
                        <JobsList jobUpdated={jobCreated} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <QueueDepth queueUpdated={queueUpdated} />
                        <WorkerStatus wsMessages={messages} />
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 gap-8">
                    <DeadLetterQueue />
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-sm font-mono" style={{ color: 'var(--muted)' }}>
                    <p>
                        Backend API: <code style={{ backgroundColor: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: 'var(--accent-3)' }}>{API_BASE}</code>
                        {' | '}
                        WebSocket: <code style={{ backgroundColor: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: 'var(--accent-3)' }}>{WS_URL}</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
