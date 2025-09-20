import React from 'react';
import RequestCollectionForm from './RequestCollectionForm';
import { Job, OilContamination, OilState } from '../../types';

const StatCard: React.FC<{ title: string, value: string, subtext?: string }> = ({ title, value, subtext }) => (
    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)'}}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {subtext && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{subtext}</p>}
    </div>
);

const MOCK_SUPPLIER_JOBS: Job[] = [
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_s1', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London, W1 2AB', volume: 45, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-07-15T10:00:00Z').toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    // FIX: Added missing plantName and plantAddress properties to conform to the Job type.
    { id: 'job_s2', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London, W1 2AB', volume: 50, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'COMPLETED', createdAt: new Date('2024-06-28T14:30:00Z').toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
];

const SupplierDashboard: React.FC = () => {
    return (
        <div className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                    <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Request a Collection</h2>
                    <RequestCollectionForm />
                </div>
                <div className="p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Collection History</h2>
                    <div className="space-y-4">
                        {MOCK_SUPPLIER_JOBS.map(job => (
                            <div key={job.id} className="p-4 border rounded-md flex justify-between items-center" style={{ borderColor: 'var(--border-color)'}}>
                                <div>
                                    <p className="font-bold">{new Date(job.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status: {job.status}</p>
                                </div>
                                <p className="font-bold text-lg" style={{ color: 'var(--primary)' }}>{job.volume}L</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                     <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>At a Glance</h2>
                    <div className="space-y-4">
                        <StatCard title="Total Volume Collected" value="95 L" />
                        <StatCard title="Last Collection" value={new Date(MOCK_SUPPLIER_JOBS[0].createdAt).toLocaleDateString()} />
                        <StatCard title="Estimated Rebate (July)" value="£14.25" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierDashboard;