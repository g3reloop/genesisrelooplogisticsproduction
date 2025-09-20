// Fix: Created JobsPage component to resolve module not found error.
import React from 'react';
import { Link } from 'react-router-dom';
import { Job, OilContamination, OilState } from '../types';
import JobsMap from '../components/driver/JobsMap';

const MOCK_JOBS: Job[] = [
    { id: 'job_1', supplierId: 'user_1', supplierName: 'The Golden Spoon', supplierAddress: '123 Culinary Lane, London, W1 2AB', volume: 50, contamination: OilContamination.LOW, state: OilState.LIQUID, status: 'PENDING', createdAt: new Date().toISOString(), lat: 51.515, lng: -0.128, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    { id: 'job_2', supplierId: 'user_5', supplierName: 'Pizza Palace', supplierAddress: '456 Dough St, London, E1 7CD', volume: 25, contamination: OilContamination.NONE, state: OilState.LIQUID, status: 'PENDING', createdAt: new Date().toISOString(), lat: 51.518, lng: -0.075, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
    { id: 'job_3', supplierId: 'user_6', supplierName: 'Fish & Chips Central', supplierAddress: '789 Battersea Rise, London, SW11 1ED', volume: 80, contamination: OilContamination.HIGH, state: OilState.SOLID, status: 'PENDING', createdAt: new Date().toISOString(), lat: 51.463, lng: -0.171, plantName: 'BioFuel Corp Depot', plantAddress: '789 Industrial Park, London, SE1 9FG' },
];

const JobListItem: React.FC<{ job: Job }> = ({ job }) => (
    <Link to={`/jobs/${job.id}`} className="block p-4 border rounded-lg hover:border-[var(--primary)] transition-colors" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex justify-between items-center">
            <div>
                <h3 className="font-bold text-lg">{job.supplierName}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{job.supplierAddress}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
                <p className="font-bold text-xl" style={{ color: 'var(--primary)' }}>{job.volume}L</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Est. +{job.volume * 2} GP</p>
            </div>
        </div>
    </Link>
);


const JobsPage: React.FC = () => {
  return (
    <div className="py-8">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">Available Jobs</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                Jobs near you. Accept a job to start a collection.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="md:h-[calc(100vh-200px)] md:sticky md:top-24">
                 <JobsMap jobs={MOCK_JOBS} />
            </div>
            <div className="space-y-4">
                {MOCK_JOBS.length > 0 ? (
                    MOCK_JOBS.map(job => <JobListItem key={job.id} job={job} />)
                ) : (
                    <p className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>No jobs available right now.</p>
                )}
            </div>
        </div>
    </div>
  );
};

export default JobsPage;