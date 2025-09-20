import React from 'react';

const StatCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="p-6 rounded-lg border h-full" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {subtext && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtext}</p>}
    </div>
);

const RecentPayoutItem: React.FC<{ supplier: string; date: string; points: number }> = ({ supplier, date, points }) => (
    <div className="p-4 border rounded-md flex justify-between items-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'var(--border-color)'}}>
        <div>
            <p className="font-bold">{supplier}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{date}</p>
        </div>
        <p className="font-bold text-lg text-right" style={{ color: 'var(--primary)' }}>
            +{points} GP
        </p>
    </div>
);

const EarningsPage: React.FC = () => {
  return (
    <div className="py-8 space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Earnings Dashboard</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                Track your Genesis Points, job history, and projected profit share.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StatCard title="Today's Earnings" value="+350 GP" subtext="From 3 completed jobs" />
            <StatCard title="This Month's Total" value="4,280 GP" />
            <StatCard title="All-Time GP" value="12,500 GP" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
            {/* Recent Payouts */}
            <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                <h2 className="text-2xl font-bold mb-6">Recent Job Payouts</h2>
                <div className="space-y-4">
                    <RecentPayoutItem supplier="The Golden Spoon" date="21 July 2024" points={150} />
                    <RecentPayoutItem supplier="Pizza Palace" date="21 July 2024" points={85} />
                    <RecentPayoutItem supplier="Fish & Chips Central" date="21 July 2024" points={115} />
                    <RecentPayoutItem supplier="Sushi Express" date="20 July 2024" points={210} />
                </div>
            </div>

            {/* Payout & Profit Share */}
            <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                <h2 className="text-2xl font-bold mb-6">Payout & Profit Share</h2>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>July GP Value (Est.)</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>£0.21 / GP</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Projected Monthly Payout (Est.)</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>£898.80</p>
                    </div>
                    <p className="text-xs pt-2" style={{ color: 'var(--text-secondary)' }}>
                        Your final monthly payout is your share of the platform's profit, calculated from the total GP earned by all drivers. The GP value fluctuates based on monthly profitability.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EarningsPage;