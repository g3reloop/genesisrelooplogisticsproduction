import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/mobile/MobileHeader';
import MobileJobCard from '../components/mobile/MobileJobCard';
import MobileBottomNavigation from '../components/mobile/MobileBottomNavigation';
import { Job, JobStatus } from '../types';
import { jobService } from '../services/jobService';
import { jobMatchingService } from '../services/jobMatchingService';
import { useAuth } from '../context/AuthContext';

const MobileJobsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'recommended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filter, searchQuery]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.role === 'DRIVER') {
        // Use intelligent job matching for drivers
        const matchedJobs = await jobMatchingService.matchJobsToDriver(user.id, 20);
        setJobs(matchedJobs.map(match => match.job));
      } else {
        // Load all jobs for suppliers and buyers
        const response = await jobService.getJobs({ status: [JobStatus.PENDING] }, 1, 50);
        setJobs(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (filter) {
      case 'nearby':
        // Filter by distance (mock implementation)
        filtered = filtered.filter(job => job.distance && job.distance < 25);
        break;
      case 'recommended':
        // Show only recommended jobs (already filtered by matching service for drivers)
        break;
      default:
        // Show all jobs
        break;
    }

    setFilteredJobs(filtered);
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      if (!user) return;

      await jobService.acceptJob(jobId, user.id);
      
      // Update local state
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId
            ? { ...job, status: JobStatus.ACCEPTED, driverId: user.id }
            : job
        )
      );

      // Navigate to active job page
      navigate('/active-job');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept job');
    }
  };

  const handleViewDetails = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleRefresh = () => {
    loadJobs();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Jobs" rightAction={
          <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        } />
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
        
        <MobileBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title="Available Jobs" 
        rightAction={
          <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        }
      />

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        {/* Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Jobs' },
            { key: 'nearby', label: 'Nearby' },
            { key: 'recommended', label: 'Recommended' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="px-4 py-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'nearby' 
                ? 'No nearby jobs available. Try expanding your search area.'
                : filter === 'recommended'
                ? 'No recommended jobs at the moment. Check back later!'
                : 'No jobs match your current filters.'
              }
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <MobileJobCard
                key={job.id}
                job={job}
                onAccept={user?.role === 'DRIVER' ? handleAcceptJob : undefined}
                onViewDetails={handleViewDetails}
                isAccepted={job.driverId === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      <MobileBottomNavigation />
    </div>
  );
};

export default MobileJobsPage;
