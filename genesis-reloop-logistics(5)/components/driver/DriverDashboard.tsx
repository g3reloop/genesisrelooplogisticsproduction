import React, { useState } from 'react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const LargeToggleSwitch: React.FC<{ isOnline: boolean; onToggle: () => void }> = ({ isOnline, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-12 rounded-full w-24 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] focus:ring-[var(--primary)]`}
            style={{ backgroundColor: isOnline ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)' }}
        >
            <span className="sr-only">Toggle Online Status</span>
            <span
                className={`inline-block w-10 h-10 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                    isOnline ? 'translate-x-13' : 'translate-x-1'
                }`}
            />
        </button>
    );
};

const StatCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="p-6 rounded-lg border h-full" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {subtext && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{subtext}</p>}
    </div>
);

const DriverDashboard: React.FC = () => {
    const [isOnline, setIsOnline] = useState(false);
    const { user } = useAuth();

    return (
        <div className="py-8 space-y-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)'}}>Welcome Back, {user?.name.split(' ')[0]}</h1>
                <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)'}}>This is your driver hub. Go online to start your shift.</p>
            </div>

            <div className="p-8 rounded-lg border max-w-xl mx-auto text-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                <h2 className="text-2xl font-bold mb-2">Your Status</h2>
                <p className="text-3xl font-bold mb-6" style={{ color: isOnline ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {isOnline ? "ONLINE" : "OFFLINE"}
                </p>
                <LargeToggleSwitch isOnline={isOnline} onToggle={() => setIsOnline(!isOnline)} />
                <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)'}}>
                    {isOnline ? "You are now visible and will receive job alerts." : "You are currently not receiving job alerts."}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <StatCard title="Total Genesis Points" value="4,280 GP" />
                <StatCard title="Today's Earnings Summary" value="+350 GP" subtext="From 3 completed jobs" />
            </div>

            <div className="text-center max-w-lg mx-auto pt-4">
                 <Button 
                    to="/jobs" 
                    size="lg" 
                    className="w-full"
                    disabled={!isOnline}
                >
                    View Available Jobs
                </Button>
                {!isOnline && <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>Toggle 'Online' to view available jobs.</p>}
            </div>
        </div>
    );
};

export default DriverDashboard;
