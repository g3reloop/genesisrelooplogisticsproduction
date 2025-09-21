import React, { useState } from 'react';
import { Button } from '../common/Button';
import { aiService, AIRouteOptimization as AIRouteOptimizationType } from '../../services/aiService';

interface AIRouteOptimizationProps {
  originalRoute: Record<string, unknown>;
  onRouteUpdate?: (optimizedRoute: AIRouteOptimizationType) => void;
}

export const AIRouteOptimization: React.FC<AIRouteOptimizationProps> = ({
  originalRoute,
  onRouteUpdate
}) => {
  const [optimizedRoute, setOptimizedRoute] = useState<AIRouteOptimizationType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoute = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const optimization = await aiService.optimizeRoute(originalRoute);
      setOptimizedRoute(optimization);
      onRouteUpdate?.(optimization);
    } catch (err) {
      setError('Failed to optimize route. Please try again.');
      console.error('Route optimization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          AI Route Optimization
        </h3>
        <Button
          onClick={optimizeRoute}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Optimizing...' : 'Optimize Route'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {optimizedRoute && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900">Savings</h4>
              <p className="text-2xl font-bold text-blue-600">
                {optimizedRoute.savingsPercentage}%
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900">Distance</h4>
              <p className="text-lg font-semibold text-green-600">
                {optimizedRoute.optimizedRoute.totalDistance.toFixed(1)} km
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900">Duration</h4>
              <p className="text-lg font-semibold text-purple-600">
                {Math.round(optimizedRoute.optimizedRoute.totalDuration)} min
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">AI Reasoning</h4>
            <p className="text-gray-700">{optimizedRoute.reasoning}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Optimized Waypoints</h4>
            <div className="space-y-2">
              {optimizedRoute.optimizedRoute.waypoints.map((waypoint, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{waypoint.address}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!optimizedRoute && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Optimize Route" to get AI-powered route recommendations</p>
        </div>
      )}
    </div>
  );
};

export default AIRouteOptimization;
