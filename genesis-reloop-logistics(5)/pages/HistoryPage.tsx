import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Job, OilContamination, OilState, UserRole } from '../types';

// Mock data
const MOCK_DRIVER_HISTORY: Job[] = [
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_d1', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London', volume: 50, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-07-20T11:00:00Z').toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_d2', supplierId: 'user_5', supplierName: 'Pizza Palace', supplierAddress: '456 Dough St, London', volume: 25, contamination: OilContamination.NONE, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-07-19T15:30:00Z').toISOString(), lat: 51.518, lng: -0.075, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
];

const MOCK_SUPPLIER_HISTORY: Job[] = [
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_s1', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London', volume: 45, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-07-15T10:00:00Z').toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_s2', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London', volume: 50, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-06-28T14:30:00Z').toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_s3', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London', volume: 40, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-06-10T09:00:00Z').toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
];

const HistoryItem: React.FC<{ job: Job, role: UserRole }> = ({ job, role }) => (
    <div className="p-4 border rounded-md flex justify-between items-center" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)'}}>
        <div>
            <p className="font-bold">{new Date(job.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            {role === UserRole.DRIVER && <p className="text-sm">{job.supplierName}</p>}
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Status: {job.status}</p>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg" style={{ color: 'var(--primary)' }}>{job.volume}L</p>
            {role === UserRole.DRIVER && <p className="text-xs" style={{ color: 'var(--text-secondary)'}}>+150 GP</p>}
        </div>
    </div>
);

const HistoryPage: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }
    
    const isDriver = user.role === UserRole.DRIVER;
    const historyData = isDriver ? MOCK_DRIVER_HISTORY : MOCK_SUPPLIER_HISTORY;
    const title = isDriver ? "Completed Jobs" : "Collection History";

    return (
        <div>
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold">{title}</h1>
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                    A record of all your past activity on the network.
                </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
                {historyData.length > 0 ? (
                    historyData.map(job => <HistoryItem key={job.id} job={job} role={user.role} />)
                ) : (
                    <p className="text-center" style={{ color: 'var(--text-secondary)'}}>No history to display yet.</p>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;