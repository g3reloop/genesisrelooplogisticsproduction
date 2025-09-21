import React, { useState, useEffect } from 'react';
import { Job, DriverProfile, AIJobMatch } from '../types';
import { aiService } from '../../services/aiService';
import { Button } from '../common/Button';
import { toast } from 'react-hot-toast';

interface AIJobMatchingProps {
  job: Job;
  onMatchSelected: (driverId: string, matchScore: number) => void;
  onClose: () => void;
}

export const AIJobMatching: React.FC<AIJobMatchingProps> = ({
  job,
  onMatchSelected,
  onClose
}) => {
  const [matches, setMatches] = useState<AIJobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<AIJobMatch | null>(null);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);

  useEffect(() => {
    loadAvailableDrivers();
  }, []);

  const loadAvailableDrivers = async () => {
    try {
      // Mock driver data - in production, fetch from Supabase
      const mockDrivers: DriverProfile[] = [
        {
          id: '1',
          userId: 'driver1',
          licenseNumber: 'DL123456',
          licenseExpiry: '2025-12-31',
          vehicleType: 'Van',
          vehicleCapacity: 200,
          insuranceProvider: 'ABC Insurance',
          insurancePolicyNumber: 'POL123456',
          insuranceExpiry: '2025-06-30',
          backgroundCheckStatus: 'VERIFIED',
          isAvailable: true,
          currentLocation: { lat: 51.5074, lng: -0.1278 },
          rating: 4.8,
          totalJobs: 45,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          userId: 'driver2',
          licenseNumber: 'DL789012',
          licenseExpiry: '2025-11-30',
          vehicleType: 'Truck',
          vehicleCapacity: 500,
          insuranceProvider: 'XYZ Insurance',
          insurancePolicyNumber: 'POL789012',
          insuranceExpiry: '2025-05-31',
          backgroundCheckStatus: 'VERIFIED',
          isAvailable: true,
          currentLocation: { lat: 51.5084, lng: -0.1284 },
          rating: 4.6,
          totalJobs: 32,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '3',
          userId: 'driver3',
          licenseNumber: 'DL345678',
          licenseExpiry: '2025-10-31',
          vehicleType: 'Van',
          vehicleCapacity: 150,
          insuranceProvider: 'DEF Insurance',
          insurancePolicyNumber: 'POL345678',
          insuranceExpiry: '2025-04-30',
          backgroundCheckStatus: 'VERIFIED',
          isAvailable: true,
          currentLocation: { lat: 51.5064, lng: -0.1268 },
          rating: 4.9,
          totalJobs: 67,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];
      setDrivers(mockDrivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load available drivers');
    }
  };

  const findBestMatches = async () => {
    try {
      setIsLoading(true);
      const availableDrivers = drivers.filter(driver => driver.isAvailable);
      const aiMatches = await aiService.matchJobToDriver(job, availableDrivers);
      setMatches(aiMatches);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast.error('Failed to find AI matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchSelect = (match: AIJobMatch) => {
    setSelectedMatch(match);
  };

  const handleConfirmMatch = () => {
    if (selectedMatch) {
      onMatchSelected(selectedMatch.driverId, selectedMatch.matchScore);
      onClose();
    }
  };

  const getDriverById = (driverId: string): DriverProfile | undefined => {
    return drivers.find(driver => driver.userId === driverId);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AI Job Matching</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Job Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Job Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Volume:</span>
                <span className="ml-2 font-medium">{job.volumeLiters} liters</span>
              </div>
              <div>
                <span className="text-gray-600">Collection Address:</span>
                <span className="ml-2 font-medium">{job.collectionAddress}</span>
              </div>
              <div>
                <span className="text-gray-600">Price per Liter:</span>
                <span className="ml-2 font-medium">£{job.pricePerLiter}</span>
              </div>
              <div>
                <span className="text-gray-600">Collection Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(job.collectionDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Matching Controls */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Driver Matching</h3>
              <p className="text-gray-600">Our AI analyzes multiple factors to find the best driver for this job</p>
            </div>
            <Button
              onClick={findBestMatches}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Finding Matches...' : 'Find Best Matches'}
            </Button>
          </div>

          {/* Matches List */}
          {matches.length > 0 && (
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">AI Matches (Ranked by Score)</h4>
              {matches.map((match, index) => {
                const driver = getDriverById(match.driverId);
                if (!driver) return null;

                const distance = job.collectionCoordinates && driver.currentLocation
                  ? calculateDistance(
                      job.collectionCoordinates.lat,
                      job.collectionCoordinates.lng,
                      driver.currentLocation.lat,
                      driver.currentLocation.lng
                    )
                  : 0;

                return (
                  <div
                    key={match.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedMatch?.id === match.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMatchSelect(match)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              Driver {driver.userId.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {driver.vehicleType} • {driver.vehicleCapacity}L capacity
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Rating:</span>
                            <span className="ml-1 font-medium">{driver.rating}/5.0</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Jobs:</span>
                            <span className="ml-1 font-medium">{driver.totalJobs}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Distance:</span>
                            <span className="ml-1 font-medium">{distance.toFixed(1)}km</span>
                          </div>
                          <div>
                            <span className="text-gray-600">License:</span>
                            <span className="ml-1 font-medium">{driver.licenseNumber}</span>
                          </div>
                        </div>

                        {match.aiReasoning && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-1">AI Reasoning:</div>
                            <div className="text-sm text-gray-600">{match.aiReasoning}</div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(match.matchScore)}`}>
                          {match.matchScore}% Match
                        </div>
                        <div className="mt-2">
                          <input
                            type="radio"
                            checked={selectedMatch?.id === match.id}
                            onChange={() => handleMatchSelect(match)}
                            className="w-4 h-4 text-blue-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Insights */}
          {matches.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">AI Insights</h4>
              <div className="text-sm text-blue-800">
                <p>
                  Our AI analyzed {drivers.filter(d => d.isAvailable).length} available drivers and found {matches.length} suitable matches.
                  The top match has a {matches[0]?.matchScore}% compatibility score based on location, capacity, rating, and availability.
                </p>
                {matches.length > 1 && (
                  <p className="mt-2">
                    We recommend the top 3 matches as they all have compatibility scores above 70%.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMatch}
              disabled={!selectedMatch}
              className="bg-green-600 hover:bg-green-700"
            >
              Assign Selected Driver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
