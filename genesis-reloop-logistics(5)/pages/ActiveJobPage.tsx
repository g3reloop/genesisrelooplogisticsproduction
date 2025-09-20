import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, OilContamination } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';

type JobStage = 'NAV_TO_SUPPLIER' | 'COLLECTING' | 'NAV_TO_PLANT' | 'DELIVERING' | 'COMPLETED';

const StageHeader: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
    <div className="text-center mb-8 border-b pb-6" style={{ borderColor: 'var(--border-color)'}}>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-lg mt-1">{subtitle}</p>
    </div>
);

const ActiveJobPage: React.FC = () => {
    const navigate = useNavigate();
    const { activeJob, completeJob } = useAuth();
    const [stage, setStage] = useState<JobStage>('NAV_TO_SUPPLIER');
    const [confirmedVolume, setConfirmedVolume] = useState('');
    const [addressCopied, setAddressCopied] = useState(false);
    
    const job: Job | null = activeJob;

    if (!job) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">No Active Job</h2>
                <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>You do not currently have an active job.</p>
                <Button to="/jobs" className="mt-6">Find a Job</Button>
            </div>
        );
    }
    
    const handleNavigate = (address: string) => {
        const encodedAddress = encodeURIComponent(address);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        try {
            window.open(mapsUrl, '_blank');
        } catch (error) {
            console.error("Failed to open maps link:", error);
            alert("Could not open the maps application. Please copy the address manually.");
        }
    };
    
    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address).then(() => {
            setAddressCopied(true);
            setTimeout(() => setAddressCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy address: ', err);
            alert('Failed to copy address. Please select it manually.');
        });
    };

    const handleComplete = async () => {
        console.log(`Job ${job.id} completed with volume: ${confirmedVolume}`);
        await completeJob();
        setStage('COMPLETED');
        setTimeout(() => navigate('/dashboard'), 2000);
    };

    const renderStageContent = () => {
        switch (stage) {
            case 'NAV_TO_SUPPLIER':
                return (
                    <div className="text-center space-y-6">
                        <StageHeader title="Step 1: Collect from Supplier" subtitle={job.supplierName} />
                        <div>
                            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Proceed to supplier location:</p>
                            <div className="mt-2 p-3 rounded-md flex items-center justify-between" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                <span className="text-sm font-mono">{job.supplierAddress}</span>
                                <button onClick={() => handleCopyAddress(job.supplierAddress)} className="text-sm font-bold ml-4" style={{ color: 'var(--primary)' }}>
                                    {addressCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <Button onClick={() => handleNavigate(job.supplierAddress)} size="lg" className="w-full">
                            Navigate to Supplier
                        </Button>
                        <Button onClick={() => setStage('COLLECTING')} variant="secondary" className="w-full">
                            I've Arrived at Supplier
                        </Button>
                    </div>
                );
            case 'COLLECTING':
                 return (
                    <div>
                         <StageHeader title="Step 2: Confirm Collection" subtitle={`From ${job.supplierName}`} />
                         <div className="space-y-6">
                            <Input
                                id="confirmedVolume"
                                label={`Confirmed Volume (Litres) - Est. ${job.volume}L`}
                                type="number"
                                value={confirmedVolume}
                                onChange={(e) => setConfirmedVolume(e.target.value)}
                                required
                                placeholder="Enter actual volume collected"
                            />
                             <div>
                                <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    Confirm Contamination Level
                                </label>
                                <select className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)'}} defaultValue={job.contamination}>
                                     {Object.values(OilContamination).map(value => <option key={value} value={value}>{value}</option>)}
                                </select>
                            </div>
                            <Button onClick={() => setStage('NAV_TO_PLANT')} size="lg" className="w-full mt-8" disabled={!confirmedVolume}>
                                Confirm & Proceed to Plant
                            </Button>
                         </div>
                    </div>
                );
            case 'NAV_TO_PLANT':
                return (
                    <div className="text-center space-y-6">
                        <StageHeader title="Step 3: Deliver to Plant" subtitle={job.plantName} />
                        <div>
                            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Proceed to biofuel plant:</p>
                            <div className="mt-2 p-3 rounded-md flex items-center justify-between" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                <span className="text-sm font-mono">{job.plantAddress}</span>
                                <button onClick={() => handleCopyAddress(job.plantAddress)} className="text-sm font-bold ml-4" style={{ color: 'var(--primary)' }}>
                                    {addressCopied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <Button onClick={() => handleNavigate(job.plantAddress)} size="lg" className="w-full">
                            Navigate to Plant
                        </Button>
                        <Button onClick={() => setStage('DELIVERING')} variant="secondary" className="w-full">
                            I've Arrived at Plant
                        </Button>
                    </div>
                );
            case 'DELIVERING':
                return (
                     <div className="text-center">
                        <StageHeader title="Step 4: Confirm Delivery" subtitle={`At ${job.plantName}`} />
                        <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>Confirm with the plant operator that the delivery of {confirmedVolume}L is complete.</p>
                        <Button onClick={handleComplete} size="lg" className="w-full mt-8">
                            Complete Job & Free Up Capacity
                        </Button>
                    </div>
                );
            case 'COMPLETED':
                return (
                    <div className="text-center animate-fade-in">
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Job Complete!</h2>
                        <p style={{ color: 'var(--text-secondary)'}}>Your capacity is now free. Redirecting to dashboard to find new jobs...</p>
                    </div>
                )
        }
    };
    
    return (
        <div className="py-12">
            <div className="max-w-2xl mx-auto p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
                {renderStageContent()}
            </div>
        </div>
    );
};

export default ActiveJobPage;