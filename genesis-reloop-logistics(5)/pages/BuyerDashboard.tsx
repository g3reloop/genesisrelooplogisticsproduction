import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Job, UserRole, JobStatus, OilContamination, OilState } from '../types';
import { supabase } from '../lib/supabase';

const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalVolume: 0,
    totalSpent: 0,
    averagePrice: 0,
    pendingDeliveries: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState<Job[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (user?.role === UserRole.BUYER) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load buyer statistics
      const [deliveriesResult, transactionsResult] = await Promise.all([
        supabase
          .from('jobs')
          .select('*')
          .eq('buyer_id', user?.id)
          .eq('status', JobStatus.COMPLETED),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user?.id)
          .eq('transaction_type', 'PURCHASE')
          .eq('status', 'COMPLETED'),
      ]);

      const deliveries = deliveriesResult.data || [];
      const transactions = transactionsResult.data || [];

      const totalVolume = deliveries.reduce((sum, job) => sum + (job.confirmedVolume || job.volume), 0);
      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const averagePrice = totalVolume > 0 ? totalSpent / totalVolume : 0;

      // Get pending deliveries
      const { count: pendingCount } = await supabase
        .from('jobs')
        .select('id', { count: 'exact' })
        .eq('buyer_id', user?.id)
        .in('status', [JobStatus.ACCEPTED, JobStatus.IN_PROGRESS]);

      setStats({
        totalPurchases: deliveries.length,
        totalVolume,
        totalSpent,
        averagePrice,
        pendingDeliveries: pendingCount || 0,
      });

      // Load recent deliveries
      const { data: recentJobs } = await supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name, address),
          driver:users!jobs_driver_id_fkey(name, phone)
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentDeliveries(recentJobs || []);
    } catch (error) {
      console.error('Error loading buyer dashboard data:', error);
    }
  };

  const updateQualityRequirements = async (requirements: string) => {
    try {
      await supabase
        .from('buyer_profiles')
        .update({ quality_requirements: requirements })
        .eq('user_id', user?.id);

      loadDashboardData();
    } catch (error) {
      console.error('Error updating quality requirements:', error);
    }
  };

  const updatePaymentTerms = async (terms: string) => {
    try {
      await supabase
        .from('buyer_profiles')
        .update({ payment_terms: terms })
        .eq('user_id', user?.id);

      loadDashboardData();
    } catch (error) {
      console.error('Error updating payment terms:', error);
    }
  };

  if (user?.role !== UserRole.BUYER) {
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
        <h1 className="text-3xl font-bold text-white">Buyer Dashboard</h1>
        <p className="text-gray-400 mt-2">Manage your biofuel plant operations and collections</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'deliveries', label: 'Deliveries' },
            { id: 'quality', label: 'Quality Control' },
            { id: 'payments', label: 'Payments' },
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Purchases</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPurchases}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white">{stats.totalVolume.toFixed(0)}L</p>
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
                  <p className="text-sm font-medium text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-white">£{stats.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Avg Price/L</p>
                  <p className="text-2xl font-bold text-white">£{stats.averagePrice.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card-bg rounded-lg p-6 border border-border-color">
              <div className="flex items-center">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingDeliveries}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Deliveries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Volume</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quality</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentDeliveries.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{job.supplier?.name}</div>
                          <div className="text-sm text-gray-400">{job.supplier?.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {job.confirmedVolume || job.volume}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`px-2 py-1 text-xs font-medium rounded mb-1 ${
                            job.contamination === OilContamination.NONE
                              ? 'bg-green-100 text-green-800'
                              : job.contamination === OilContamination.LOW
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {job.contamination}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            job.state === OilState.LIQUID
                              ? 'bg-blue-100 text-blue-800'
                              : job.state === OilState.SOLID
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {job.state}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{job.driver?.name || 'Unassigned'}</div>
                          {job.driver?.phone && (
                            <div className="text-sm text-gray-400">{job.driver.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quality Control Tab */}
      {selectedTab === 'quality' && (
        <div className="space-y-6">
          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <h3 className="text-lg font-semibold text-white mb-4">Quality Requirements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Quality Standards
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Specify your quality requirements for UCO..."
                  onChange={(e) => updateQualityRequirements(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Contamination Levels</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• None: Preferred</li>
                    <li>• Low: Acceptable</li>
                    <li>• High: Requires treatment</li>
                  </ul>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Oil State</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Liquid: Preferred</li>
                    <li>• Mixed: Acceptable</li>
                    <li>• Solid: Requires heating</li>
                  </ul>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Volume Requirements</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Minimum: 50L</li>
                    <li>• Maximum: 1000L</li>
                    <li>• Preferred: 200-500L</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <h3 className="text-lg font-semibold text-white mb-4">Quality Reports</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Monthly Quality Report</h4>
                  <p className="text-sm text-gray-400">December 2024</p>
                </div>
                <button className="px-4 py-2 bg-primary text-black rounded hover:bg-primary/90">
                  Download PDF
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">Supplier Quality Scores</h4>
                  <p className="text-sm text-gray-400">Current ratings</p>
                </div>
                <button className="px-4 py-2 bg-primary text-black rounded hover:bg-primary/90">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {selectedTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Terms
                </label>
                <select
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => updatePaymentTerms(e.target.value)}
                >
                  <option value="NET_30">Net 30 days</option>
                  <option value="NET_15">Net 15 days</option>
                  <option value="IMMEDIATE">Immediate payment</option>
                  <option value="CUSTOM">Custom terms</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Payment Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 border border-gray-600 rounded-lg hover:border-primary text-left">
                    <div className="font-medium text-white">Bank Transfer</div>
                    <div className="text-sm text-gray-400">Direct bank transfer</div>
                  </button>
                  <button className="p-4 border border-gray-600 rounded-lg hover:border-primary text-left">
                    <div className="font-medium text-white">Stripe</div>
                    <div className="text-sm text-gray-400">Credit card processing</div>
                  </button>
                  <button className="p-4 border border-gray-600 rounded-lg hover:border-primary text-left">
                    <div className="font-medium text-white">Crypto</div>
                    <div className="text-sm text-gray-400">Cryptocurrency payment</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card-bg rounded-lg p-6 border border-border-color">
            <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
            <div className="space-y-4">
              {recentDeliveries.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-white">{job.supplier?.name}</div>
                    <div className="text-sm text-gray-400">{job.confirmedVolume || job.volume}L • {new Date(job.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">£{(job.paymentAmount || 0).toFixed(2)}</div>
                    <div className={`text-sm ${
                      job.paymentStatus === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {job.paymentStatus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other tabs */}
      {selectedTab === 'deliveries' && (
        <div className="bg-card-bg rounded-lg p-6 border border-border-color">
          <h3 className="text-lg font-semibold text-white mb-4">Delivery Management</h3>
          <p className="text-gray-400">Advanced delivery tracking and management would be implemented here.</p>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="bg-card-bg rounded-lg p-6 border border-border-color">
          <h3 className="text-lg font-semibold text-white mb-4">Facility Settings</h3>
          <p className="text-gray-400">Facility configuration and preferences would be implemented here.</p>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
