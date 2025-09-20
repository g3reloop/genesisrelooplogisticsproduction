import React from 'react';
import { Job, JobStatus } from '../../types';

interface MobileJobCardProps {
  job: Job;
  onAccept?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isAccepted?: boolean;
}

const MobileJobCard: React.FC<MobileJobCardProps> = ({
  job,
  onAccept,
  onViewDetails,
  isAccepted = false
}) => {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PENDING:
        return 'bg-yellow-500';
      case JobStatus.ACCEPTED:
        return 'bg-blue-500';
      case JobStatus.IN_PROGRESS:
        return 'bg-purple-500';
      case JobStatus.COMPLETED:
        return 'bg-green-500';
      case JobStatus.CANCELLED:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getContaminationColor = (contamination: string) => {
    switch (contamination) {
      case 'NONE':
        return 'text-green-600';
      case 'LOW':
        return 'text-yellow-600';
      case 'MEDIUM':
        return 'text-orange-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {job.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {job.pickupCity}, {job.pickupPostcode}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(job.status)}`}>
            {job.status.replace('_', ' ')}
          </span>
          {job.urgency === 'high' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              URGENT
            </span>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Volume:</span>
          <span className="text-sm font-medium text-gray-900">
            {job.volume}L
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Contamination:</span>
          <span className={`text-sm font-medium ${getContaminationColor(job.contamination)}`}>
            {job.contamination}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Payment:</span>
          <span className="text-sm font-bold text-green-600">
            £{job.payment}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Distance:</span>
          <span className="text-sm font-medium text-gray-900">
            {job.distance || 'N/A'} km
          </span>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-700 line-clamp-2">
            {job.description}
          </p>
        </div>
      )}

      {/* Pickup Details */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Pickup Details</h4>
        <div className="space-y-1">
          <p className="text-sm text-gray-700">
            📍 {job.pickupAddress}
          </p>
          <p className="text-sm text-gray-700">
            🕐 {new Date(job.pickupTime).toLocaleString()}
          </p>
          {job.specialInstructions && (
            <p className="text-sm text-gray-700">
              📝 {job.specialInstructions}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {!isAccepted && job.status === JobStatus.PENDING && onAccept && (
          <button
            onClick={() => onAccept(job.id)}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
          >
            Accept Job
          </button>
        )}
        
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(job.id)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            View Details
          </button>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Job ID: {job.id.slice(0, 8)}...</span>
          <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default MobileJobCard;
