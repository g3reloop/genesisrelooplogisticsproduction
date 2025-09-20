import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Job, UserRole, VerificationStatus, JobStatus } from '../types';
import { supabase } from '../lib/supabase';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalRevenue: 0,
    activeDrivers: 0,
    pendingVerifications: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load statistics
      const [usersResult, jobsResult, revenueResult, driversResult, verificationsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id', { count: 'exact' }),
        supabase.from('transactions').select('amount').eq('status', 'COMPLETED'),
        supabase.from('driver_locations').select('driver_id').eq('is_online', true),
        supabase.from('users').select('id', { count: 'exact' }).eq('verification_status', 'PENDING'),
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalJobs: jobsResult.count || 0,
        totalRevenue,
        activeDrivers: new Set(driversResult.data?.map(d => d.driver_id)).size,
        pendingVerifications: verificationsResult.count || 0,
      });

      // Load recent users
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentUsers(users || []);

      // Load recent jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name),
          driver:users!jobs_driver_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentJobs(jobs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const verifyUser = async (userId: string, status: VerificationStatus) => {
    try {
      await supabase
        .from('users')
        .update({ verification_status: status })
        .eq('id', userId);

      loadDashboardData();
    } catch (error) {
      console.error('Error verifying user:', error);
    }
  };

  const updateJobStatus = async (jobId: string, status: JobStatus) => {
    try {
      await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId);

      loadDashboardData();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">Manage your platform and monitor activity</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">£{stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Active Drivers</p>
                  <p className="text-2xl font-bold text-white">{stats.activeDrivers}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Pending Verifications</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingVerifications}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <div className="flex space-x-2">
                      {user.verificationStatus === VerificationStatus.PENDING && (
                        <>
                          <button
                            onClick={() => verifyUser(user.id, VerificationStatus.VERIFIED)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => verifyUser(user.id, VerificationStatus.REJECTED)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.verificationStatus === VerificationStatus.VERIFIED
                          ? 'bg-green-100 text-green-800'
                          : user.verificationStatus === VerificationStatus.REJECTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.verificationStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Jobs</h3>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{job.title}</p>
                      <p className="text-sm text-gray-400">
                        {job.supplier?.name} → {job.driver?.name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-gray-500">{job.volume}L • {job.contamination}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        job.status === JobStatus.COMPLETED
                          ? 'bg-green-100 text-green-800'
                          : job.status === JobStatus.IN_PROGRESS
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === JobStatus.PENDING
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </span>
                      <select
                        value={job.status}
                        onChange={(e) => updateJobStatus(job.id, e.target.value as JobStatus)}
                        className="text-xs bg-gray-700 text-white rounded px-2 py-1"
                      >
                        <option value={JobStatus.PENDING}>Pending</option>
                        <option value={JobStatus.ACCEPTED}>Accepted</option>
                        <option value={JobStatus.IN_PROGRESS}>In Progress</option>
                        <option value={JobStatus.COMPLETED}>Completed</option>
                        <option value={JobStatus.CANCELLED}>Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="bg-card-bg rounded-lg p-6 border border-border-color">
          <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.verificationStatus === VerificationStatus.VERIFIED
                          ? 'bg-green-100 text-green-800'
                          : user.verificationStatus === VerificationStatus.REJECTED
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.verificationStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {user.verificationStatus === VerificationStatus.PENDING && (
                          <>
                            <button
                              onClick={() => verifyUser(user.id, VerificationStatus.VERIFIED)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => verifyUser(user.id, VerificationStatus.REJECTED)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button className="text-blue-600 hover:text-blue-900">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {selectedTab === 'jobs' && (
        <div className="bg-card-bg rounded-lg p-6 border border-border-color">
          <h3 className="text-lg font-semibold text-white mb-4">Job Management</h3>
          <p className="text-gray-400">Job management interface would be implemented here.</p>
        </div>
      )}

      {selectedTab === 'analytics' && (
        <div className="bg-card-bg rounded-lg p-6 border border-border-color">
          <h3 className="text-lg font-semibold text-white mb-4">Analytics</h3>
          <p className="text-gray-400">Analytics dashboard would be implemented here.</p>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="bg-card-bg rounded-lg p-6 border border-border-color">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Settings</h3>
          <p className="text-gray-400">Platform configuration would be implemented here.</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
