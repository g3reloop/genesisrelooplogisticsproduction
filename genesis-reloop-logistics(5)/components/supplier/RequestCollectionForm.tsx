import React, { useState } from 'react';
import { OilContamination, OilState } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';

const RequestCollectionForm: React.FC = () => {
    const [volume, setVolume] = useState('');
    const [contamination, setContamination] = useState<OilContamination>(OilContamination.NONE);
    const [state, setState] = useState<OilState>(OilState.LIQUID);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            console.log({ volume, contamination, state });
        }, 1500);
    };

    if (submitted) {
        return (
            <div className="p-4 text-center bg-green-500 bg-opacity-10 text-green-300 rounded-md border border-green-500/30">
                <h3 className="font-bold">Collection Requested!</h3>
                <p className="text-sm mt-1">We've notified nearby drivers. You'll receive an update once your job is accepted.</p>
                <Button onClick={() => setSubmitted(false)} variant="secondary" size="sm" className="mt-4">
                    Request Another
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Input
                    id="volume"
                    label="Estimated Volume (Litres)"
                    type="number"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    required
                    placeholder="e.g., 50"
                />
                 <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Please provide your best estimate. The driver will confirm the exact volume on collection.
                </p>
            </div>
            
            <div>
                <label htmlFor="contamination" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Contamination Level
                </label>
                <select
                    id="contamination"
                    value={contamination}
                    onChange={(e) => setContamination(e.target.value as OilContamination)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 sm:text-sm"
                    style={{ 
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)', 
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--primary)'
                    } as React.CSSProperties}
                >
                    {Object.values(OilContamination).map(value => (
                        <option key={value} value={value}>{value}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="state" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Physical State of Oil
                </label>
                <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value as OilState)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 sm:text-sm"
                    style={{ 
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)', 
                        color: 'var(--text-primary)',
                        '--tw-ring-color': 'var(--primary)'
                    } as React.CSSProperties}
                >
                    {Object.values(OilState).map(value => (
                        <option key={value} value={value}>{value}</option>
                    ))}
                </select>
            </div>
            
            <div className="pt-2">
                <Button type="submit" disabled={loading || !volume} className="w-full py-3">
                    {loading ? 'Submitting Request...' : 'Submit Collection Request'}
                </Button>
            </div>
        </form>
    );
};

export default RequestCollectionForm;
