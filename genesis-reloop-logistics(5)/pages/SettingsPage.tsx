import React, { useState } from 'react';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

// A simple toggle switch component for this page
const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => {
    return (
        <button
            onClick={onToggle}
            className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--card-bg)] focus:ring-[var(--primary)]`}
            style={{ backgroundColor: enabled ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)' }}
        >
            <span className="sr-only">Toggle Notification</span>
            <span
                className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                    enabled ? 'translate-x-9' : 'translate-x-1'
                }`}
            />
        </button>
    );
};


const SettingsPage: React.FC = () => {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock password change logic
        alert('Password change functionality is not yet implemented.');
    }

  return (
    <div className="py-12">
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                Manage your account preferences and notification settings.
            </p>
        </div>

        {/* Change Password Card */}
        <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
            <h2 className="text-2xl font-bold mb-6">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <Input id="current-password" label="Current Password" type="password" required />
                <Input id="new-password" label="New Password" type="password" required />
                <Input id="confirm-password" label="Confirm New Password" type="password" required />
                <div className="pt-2">
                    <Button type="submit" variant="secondary" className="w-full">Save New Password</Button>
                </div>
            </form>
        </div>
        
        {/* Notification Settings Card */}
        <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
            <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
            <ul className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <li className="py-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-medium">Email Notifications</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Get notified about job status, earnings, and account updates via email.</p>
                    </div>
                    <ToggleSwitch enabled={emailNotifications} onToggle={() => setEmailNotifications(!emailNotifications)} />
                </li>
                <li className="py-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-medium">Push Notifications</h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Receive real-time alerts for new jobs and important updates on your device.</p>
                    </div>
                    <ToggleSwitch enabled={pushNotifications} onToggle={() => setPushNotifications(!pushNotifications)} />
                </li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;