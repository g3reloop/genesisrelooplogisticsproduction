import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { User, UserRole } from '../types';

// #region Display Components
const ProfileDetailItem: React.FC<{ label: string; value?: string | React.ReactNode }> = ({ label, value }) => (
    <div className="py-3 sm:py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
        <dt className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</dt>
        <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 break-words">{value || 'Not set'}</dd>
    </div>
);

const ProfileDisplay: React.FC<{ user: User; onEdit: () => void }> = ({ user, onEdit }) => (
    <>
        <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
            <p className="text-md" style={{ color: 'var(--text-secondary)' }}>Manage your account details and view your status on the network.</p>
        </div>
        <div className="mt-8 border-t border-[var(--border-color)]">
            <dl className="divide-y divide-[var(--border-color)]">
                <ProfileDetailItem label="Full Name / Business Name" value={user.name} />
                <ProfileDetailItem label="Email Address" value={user.email} />
                <ProfileDetailItem label="Account Type" value={<span className="capitalize">{user.role.toLowerCase()}</span>} />
                
                {user.role === UserRole.DRIVER && (
                    <>
                        <ProfileDetailItem label="Primary Address" value={user.address} />
                        <ProfileDetailItem label="Wallet Address" value={<span className="font-mono break-all">{user.walletAddress}</span>} />
                        <hr className="my-2 border-[var(--border-color)]" />
                        <ProfileDetailItem label="License Status" value={<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-300">Verified</span>} />
                        <ProfileDetailItem label="Vehicle Registration" value={user.vehicleReg} />
                        <ProfileDetailItem label="Vehicle Type" value={user.vehicleType} />
                    </>
                )}
                {user.role === UserRole.SUPPLIER && (
                    <>
                        <ProfileDetailItem label="Collection Address" value={user.address} />
                        <hr className="my-2 border-[var(--border-color)]" />
                        <ProfileDetailItem label="Business Status" value={<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-300">Verified</span>} />
                        <ProfileDetailItem label="Companies House No." value={user.companiesHouseNumber} />
                    </>
                )}
            </dl>
        </div>
        <div className="mt-8">
             <Button variant="secondary" className="w-full" onClick={onEdit}>Edit Profile</Button>
        </div>
    </>
);
// #endregion

// #region Edit Form Component
const ProfileEditForm: React.FC<{ user: User; onSave: (updatedUser: User) => Promise<void>; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Failed to save profile:", error);
            // You could show an error message to the user here
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
                <p className="text-md" style={{ color: 'var(--text-secondary)' }}>Update your account details below.</p>
            </div>
            <div className="mt-8 space-y-6">
                <Input id="name" label="Full Name / Business Name" value={formData.name} onChange={handleChange} />
                <Input id="address" label="Address" value={formData.address || ''} onChange={handleChange} />
                
                {user.role === UserRole.DRIVER && (
                    <>
                        <Input id="walletAddress" label="Wallet Address" value={formData.walletAddress || ''} onChange={handleChange} />
                        <Input id="vehicleReg" label="Vehicle Registration" value={formData.vehicleReg || ''} onChange={handleChange} />
                        <Input id="vehicleType" label="Vehicle Type" value={formData.vehicleType || ''} onChange={handleChange} />
                    </>
                )}

                {user.role === UserRole.SUPPLIER && (
                    <Input id="companiesHouseNumber" label="Companies House No." value={formData.companiesHouseNumber || ''} onChange={handleChange} />
                )}
            </div>
            <div className="mt-8 flex space-x-4">
                 <Button type="button" variant="secondary" className="w-full" onClick={onCancel} disabled={loading}>Cancel</Button>
                 <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                 </Button>
            </div>
        </form>
    );
};
// #endregion

const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
  
    if (!user) return <div className="text-center py-20">Loading profile...</div>;

    const handleSave = async (updatedUser: User) => {
        await updateUser(updatedUser);
        setIsEditing(false);
    };

    return (
        <div className="py-12">
            <div className="p-8 rounded-lg max-w-2xl mx-auto border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                {isEditing ? (
                    <ProfileEditForm user={user} onSave={handleSave} onCancel={() => setIsEditing(false)} />
                ) : (
                    <ProfileDisplay user={user} onEdit={() => setIsEditing(true)} />
                )}
            </div>
        </div>
    );
};

export default ProfilePage;