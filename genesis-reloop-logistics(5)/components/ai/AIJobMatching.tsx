import React, { useState } from 'react';
import { Button } from '../common/Button';
import { aiService, AIJobMatch } from '../../services/aiService';

interface AIJobMatchingProps {
  job: Record<string, unknown>;
  drivers: Record<string, unknown>[];
  onMatchSelect?: (match: AIJobMatch) => void;
}

export const AIJobMatching: React.FC<AIJobMatchingProps> = ({
  job,
  drivers,
  onMatchSelect
}) => {
  const [matches, setMatches] = useState<AIJobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findMatches = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const aiMatches = await aiService.matchJobToDrivers(job, drivers);
      setMatches(aiMatches);
    } catch (err) {
      setError('Failed to find AI matches. Please try again.');
      console.error('AI matching error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          AI Job Matching
        </h3>
        <Button
          onClick={findMatches}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Finding Matches...' : 'Find AI Matches'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">
            Recommended Matches
          </h4>
          {matches.map((match, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onMatchSelect?.(match)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Driver {match.driverId}
                  </p>
                  <p className="text-sm text-gray-600">
                    {match.reasoning}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {match.matchScore}%
                  </div>
                  <div className="text-sm text-gray-500">Match Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {matches.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          <p>Click "Find AI Matches" to get AI-powered driver recommendations</p>
        </div>
      )}
    </div>
  );
};

export default AIJobMatching;
