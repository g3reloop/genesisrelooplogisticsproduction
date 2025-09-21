import React, { useState, useEffect } from 'react';
import { DriverProfile, AIRouteOptimization } from '../types';
import { aiService } from '../../services/aiService';
import { Button } from '../common/Button';
import { toast } from 'react-hot-toast';

interface RouteWaypoint {
  lat: number;
  lng: number;
  address: string;
  type: 'collection' | 'delivery' | 'depot';
  jobId?: string;
  estimatedTime?: number;
  priority?: 'high' | 'medium' | 'low';
}

interface AIRouteOptimizationProps {
  driverId: string;
  waypoints: RouteWaypoint[];
  onRouteOptimized: (optimizedRoute: any) => void;
  onClose: () => void;
}

export const AIRouteOptimization: React.FC<AIRouteOptimizationProps> = ({
  driverId,
  waypoints,
  onRouteOptimized,
  onClose
}) => {
  const [originalRoute, setOriginalRoute] = useState<any>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<AIRouteOptimization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    initializeRoute();
  }, [waypoints]);

  const initializeRoute = () => {
    const totalDistance = calculateTotalDistance(waypoints);
    const totalTime = calculateTotalTime(waypoints, totalDistance);
    
    const route = {
      waypoints: waypoints.map(wp => ({
        ...wp,
        estimatedTime: wp.estimatedTime || 30 // Default 30 minutes per stop
      })),
      totalDistance,
      totalTime,
      fuelCost: calculateFuelCost(totalDistance),
      efficiency: 100 // Original route efficiency
    };
    
    setOriginalRoute(route);
  };

  const calculateTotalDistance = (points: RouteWaypoint[]): number => {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += calculateDistance(
        points[i].lat,
        points[i].lng,
        points[i + 1].lat,
        points[i + 1].lng
      );
    }
    return total;
  };

  const calculateTotalTime = (points: RouteWaypoint[], distance: number): number => {
    const averageSpeed = 30; // km/h in city
    const drivingTime = (distance / averageSpeed) * 60; // minutes
    const stopTime = points.reduce((total, point) => total + (point.estimatedTime || 30), 0);
    return Math.round(drivingTime + stopTime);
  };

  const calculateFuelCost = (distance: number): number => {
    const fuelEfficiency = 8; // km per liter
    const fuelPrice = 1.50; // £ per liter
    return (distance / fuelEfficiency) * fuelPrice;
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

  const optimizeRoute = async () => {
    try {
      setIsLoading(true);
      const optimization = await aiService.optimizeRoute(driverId, originalRoute);
      setOptimizedRoute(optimization);
    } catch (error) {
      console.error('Error optimizing route:', error);
      toast.error('Failed to optimize route');
    } finally {
      setIsLoading(false);
    }
  };

  const applyOptimizedRoute = async () => {
    try {
      setIsApplying(true);
      if (optimizedRoute) {
        onRouteOptimized(optimizedRoute.optimizedRoute);
        toast.success('Optimized route applied successfully');
        onClose();
      }
    } catch (error) {
      console.error('Error applying route:', error);
      toast.error('Failed to apply optimized route');
    } finally {
      setIsApplying(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (km: number): string => {
    return `${km.toFixed(1)} km`;
  };

  const formatCurrency = (amount: number): string => {
    return `£${amount.toFixed(2)}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collection': return '📦';
      case 'delivery': return '🚚';
      case 'depot': return '🏢';
      default: return '📍';
    }
  };

  if (!originalRoute) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">AI Route Optimization</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Route Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{originalRoute.waypoints.length}</div>
              <div className="text-sm text-gray-600">Stops</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{formatDistance(originalRoute.totalDistance)}</div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(originalRoute.totalTime)}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(originalRoute.fuelCost)}</div>
              <div className="text-sm text-gray-600">Fuel Cost</div>
            </div>
          </div>

          {/* Optimization Controls */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Route Optimization</h3>
              <p className="text-gray-600">Our AI will analyze traffic, distance, and efficiency to optimize your route</p>
            </div>
            <Button
              onClick={optimizeRoute}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Optimizing...' : 'Optimize Route'}
            </Button>
          </div>

          {/* Route Comparison */}
          {optimizedRoute && (
            <div className="space-y-6">
              {/* Comparison Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-4">Optimization Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {optimizedRoute.savingsPercentage?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-800">Time Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDistance(originalRoute.totalDistance - (optimizedRoute.optimizedRoute.totalDistance || originalRoute.totalDistance))}
                    </div>
                    <div className="text-sm text-green-800">Distance Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(originalRoute.fuelCost - ((optimizedRoute.optimizedRoute.fuelCost || originalRoute.fuelCost)))}
                    </div>
                    <div className="text-sm text-purple-800">Fuel Savings</div>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              {optimizedRoute.aiReasoning && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">AI Optimization Reasoning</h4>
                  <p className="text-gray-700">{optimizedRoute.aiReasoning}</p>
                </div>
              )}

              {/* Route Details Toggle */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  variant="outline"
                >
                  {showDetails ? 'Hide' : 'Show'} Route Details
                </Button>
              </div>

              {/* Detailed Route Comparison */}
              {showDetails && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Original Route */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Original Route</h4>
                    <div className="space-y-3">
                      {originalRoute.waypoints.map((waypoint, index) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                          <div className="text-lg">{getTypeIcon(waypoint.type)}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{waypoint.address}</div>
                            <div className="text-xs text-gray-600">
                              {waypoint.type} • {waypoint.estimatedTime}min
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">#{index + 1}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span>Total Distance:</span>
                        <span className="font-medium">{formatDistance(originalRoute.totalDistance)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Time:</span>
                        <span className="font-medium">{formatTime(originalRoute.totalTime)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fuel Cost:</span>
                        <span className="font-medium">{formatCurrency(originalRoute.fuelCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Optimized Route */}
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-4">Optimized Route</h4>
                    <div className="space-y-3">
                      {optimizedRoute.optimizedRoute.waypoints?.map((waypoint: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                          <div className="text-lg">{getTypeIcon(waypoint.type)}</div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{waypoint.address}</div>
                            <div className="text-xs text-gray-600">
                              {waypoint.type} • {waypoint.estimatedTime}min
                            </div>
                          </div>
                          <div className="text-xs text-green-600">#{index + 1}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="flex justify-between text-sm">
                        <span>Total Distance:</span>
                        <span className="font-medium text-green-600">
                          {formatDistance(optimizedRoute.optimizedRoute.totalDistance || originalRoute.totalDistance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Time:</span>
                        <span className="font-medium text-green-600">
                          {formatTime(optimizedRoute.optimizedRoute.totalTime || originalRoute.totalTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Fuel Cost:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(optimizedRoute.optimizedRoute.fuelCost || originalRoute.fuelCost)}
                        </span>
                      </div>
                    </div>
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
                  onClick={applyOptimizedRoute}
                  disabled={isApplying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isApplying ? 'Applying...' : 'Apply Optimized Route'}
                </Button>
              </div>
            </div>
          )}

          {/* No Optimization Yet */}
          {!optimizedRoute && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Optimize</h3>
              <p className="text-gray-600 mb-6">
                Click "Optimize Route" to let our AI analyze and improve your delivery route
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  Use Original Route
                </Button>
                <Button
                  onClick={optimizeRoute}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Optimizing...' : 'Optimize Route'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
