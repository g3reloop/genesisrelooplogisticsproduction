// Fix: Created JobDetailsPage component to resolve module not found error.
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job, OilContamination, OilState } from '../types';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

// In a real app, this data would be fetched from a service/API
const MOCK_JOBS: Job[] = [
    { id: 'job_1', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London, W1 2AB', volume: 50, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'PENDING', createdAt: new Date().toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    { id: 'job_2', supplierId: 'user_5', supplierName: 'Pizza Palace', supplierAddress: '456 Dough St, London, E1 7CD', volume: 25, contamination: OilContamination.NONE, state: OilState.LIQUID, status: 'PENDING', createdAt: new Date().toISOString(), lat: 51.518, lng: -0.075, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    { id: 'job_3', supplierId: 'user_6', supplierName: 'Fish & Chips Central', supplierAddress: '789 Battersea Rise, London, SW11 1ED', volume: 80, contamination: OilContamination.HIGH, state: OilState.SOLID, status: 'PENDING', createdAt: new Date().toISOString(), lat: 51.463, lng: -0.171, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
];

const JobDetailItem: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-lg font-bold mt-1">{value}</p>
    </div>
);


const JobDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { acceptJob, activeJob } = useAuth();
    const job = MOCK_JOBS.find(j => j.id === id);

    const handleAcceptJob = async () => {
        if (job) {
            await acceptJob(job);
            navigate('/active-job');
        }
    };
    
    if (!job) {
        return <div className="text-center py-20">Job not found.</div>;
    }

    return (
        <div className="py-12">
            <div className="max-w-2xl mx-auto p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                <div className="text-center mb-8 border-b pb-6" style={{ borderColor: 'var(--border-color)'}}>
                    <h1 className="text-3xl font-bold">{job.supplierName}</h1>
                    <p className="text-md mt-1" style={{ color: 'var(--text-secondary)' }}>{job.supplierAddress}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <JobDetailItem label="Est. Volume" value={`${job.volume} Litres`} />
                    <JobDetailItem label="Est. Payout" value={`+${job.volume * 2} GP`} />
                    <JobDetailItem label="Contamination" value={job.contamination} />
                    <JobDetailItem label="Oil State" value={job.state} />
                </div>

                <div className="space-y-4">
                    <Button 
                        onClick={handleAcceptJob} 
                        size="lg" 
                        className="w-full"
                        disabled={!!activeJob}
                    >
                        {activeJob ? 'You have an active job' : 'Accept Job'}
                    </Button>
                    <Button to="/jobs" variant="secondary" className="w-full">
                        Back to Job List
                    </Button>
                </div>
                 {activeJob && <p className="text-center text-xs mt-2" style={{ color: 'var(--text-secondary)'}}>Complete your current job before accepting a new one.</p>}
            </div>
        </div>
    );
};

export default JobDetailsPage;