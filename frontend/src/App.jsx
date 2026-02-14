import { MetricsCard } from './components/MetricsCard';
import { JobSubmissionForm } from './components/JobSubmissionForm';
import { JobsList } from './components/JobsList';
import { QueueDepth } from './components/QueueDepth';
import { DeadLetterQueue } from './components/DeadLetterQueue';
import { usePolling } from './hooks/usePolling';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function App() {
    const { queueDepths } = usePolling(API_BASE, 2000);

    return (
        <div style={{ backgroundColor: 'var(--bg)', minHeight: '100vh' }} className="p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-bold mb-2" style={{ color: 'var(--text)' }}>
                            📊 Distributed Task Queue
                        </h1>
                        <p style={{ color: 'var(--muted)' }} className="font-mono text-sm">
                            Real-time job processing monitoring and control
                        </p>
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
                        <JobSubmissionForm />
                        <JobsList />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <QueueDepth queueDepths={queueDepths} />
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
                    </p>
                </div>
            </div>
        </div>
    );
}
