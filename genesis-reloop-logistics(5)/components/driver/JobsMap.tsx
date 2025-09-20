// Fix: Created placeholder JobsMap component to resolve module not found error.
import React from 'react';
import { Job } from '../../types';

interface JobsMapProps {
  jobs: Job[];
}

const JobsMap: React.FC<JobsMapProps> = ({ jobs }) => {
  return (
    <div 
      className="w-full h-full rounded-lg border flex items-center justify-center"
      style={{ 
        backgroundColor: 'var(--card-bg)', 
        borderColor: 'var(--border-color)', 
        minHeight: '300px'
      }}
    >
        <div className="text-center p-4">
            <h3 className="text-lg font-bold">Jobs Map</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)'}}>
                Interactive map of available jobs will be displayed here.
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)'}}>
                ({jobs.length} jobs nearby)
            </p>
        </div>
    </div>
  );
};

export default JobsMap;
