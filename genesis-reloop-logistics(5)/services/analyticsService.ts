import { supabase } from '../lib/supabase';
import { JobStatus, UserRole } from '../types';

export const analyticsService = {
  // Get platform overview analytics
  getPlatformOverview: async (): Promise<any> => {
    try {
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      const { count: totalJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });

      if (jobsError) throw jobsError;

      const { count: completedJobs, error: completedJobsError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', JobStatus.COMPLETED);

      if (completedJobsError) throw completedJobsError;

      return {
        totalUsers: totalUsers || 0,
        totalJobs: totalJobs || 0,
        completedJobs: completedJobs || 0,
        totalVolumeCollected: 125000, // Mock data
        totalGenesisPointsAwarded: 500000, // Mock data
        estimatedRevenue: 25000, // Mock data
        activeDrivers: 15, // Mock data
        activeSuppliers: 80, // Mock data
        newUsersLast30Days: 12 // Mock data
      };
    } catch (error) {
      console.error('Error getting platform overview:', error);
      throw error;
    }
  },

  // Get user activity analytics
  getUserActivity: async (userId: string): Promise<any> => {
    try {
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .or(`supplier_id.eq.${userId},driver_id.eq.${userId}`);

      if (jobsError) throw jobsError;

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (transactionsError) throw transactionsError;

      return {
        jobs: jobs || [],
        transactions: transactions || [],
        totalEarnings: transactions?.reduce((sum, t) => sum + t.amount, 0) || 0,
        completedJobs: jobs?.filter(job => job.status === JobStatus.COMPLETED).length || 0
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  },

  // Get job performance analytics
  getJobPerformance: async (jobId: string): Promise<any> => {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      return {
        job,
        actualDuration: '2h 15m', // Mock data
        estimatedDuration: '2h 0m', // Mock data
        driverRatingForJob: 4.8, // Mock data
        dwtnStatus: 'Verified', // Mock data
        efficiency: 95 // Mock data
      };
    } catch (error) {
      console.error('Error getting job performance:', error);
      throw error;
    }
  },

  // Get financial summary
  getFinancialSummary: async (period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<any> => {
    try {
      const mockFinancialData = {
        period,
        totalRevenue: 15000,
        totalPayouts: 10000,
        netProfit: 5000,
        gpValueFluctuation: '+2.5%',
        topDrivers: [{ name: 'John Doe', earnings: 1200 }],
        topSuppliers: [{ name: 'The Golden Spoon', volume: 500 }],
        averageJobValue: 85,
        platformFee: 1500
      };

      return mockFinancialData;
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  },

  // Get driver analytics
  getDriverAnalytics: async (driverId: string): Promise<any> => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('driver_id', driverId);

      if (error) throw error;

      const completedJobs = jobs?.filter(job => job.status === JobStatus.COMPLETED) || [];
      const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.payment || 0), 0);
      const totalVolume = completedJobs.reduce((sum, job) => sum + (job.volume || 0), 0);

      return {
        totalJobs: jobs?.length || 0,
        completedJobs: completedJobs.length,
        totalEarnings,
        totalVolume,
        averageJobValue: completedJobs.length > 0 ? totalEarnings / completedJobs.length : 0,
        completionRate: jobs?.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
        rating: 4.5 // Mock data
      };
    } catch (error) {
      console.error('Error getting driver analytics:', error);
      throw error;
    }
  },

  // Get supplier analytics
  getSupplierAnalytics: async (supplierId: string): Promise<any> => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('supplier_id', supplierId);

      if (error) throw error;

      const completedJobs = jobs?.filter(job => job.status === JobStatus.COMPLETED) || [];
      const totalVolume = completedJobs.reduce((sum, job) => sum + (job.volume || 0), 0);

      return {
        totalJobs: jobs?.length || 0,
        completedJobs: completedJobs.length,
        totalVolume,
        averageVolumePerJob: completedJobs.length > 0 ? totalVolume / completedJobs.length : 0,
        completionRate: jobs?.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
        averageContamination: 'LOW' // Mock data
      };
    } catch (error) {
      console.error('Error getting supplier analytics:', error);
      throw error;
    }
  },

  // Get buyer analytics
  getBuyerAnalytics: async (buyerId: string): Promise<any> => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('buyer_id', buyerId);

      if (error) throw error;

      const completedJobs = jobs?.filter(job => job.status === JobStatus.COMPLETED) || [];
      const totalVolume = completedJobs.reduce((sum, job) => sum + (job.volume || 0), 0);
      const totalSpent = completedJobs.reduce((sum, job) => sum + (job.payment || 0), 0);

      return {
        totalJobs: jobs?.length || 0,
        completedJobs: completedJobs.length,
        totalVolume,
        totalSpent,
        averageVolumePerJob: completedJobs.length > 0 ? totalVolume / completedJobs.length : 0,
        averagePricePerLiter: totalVolume > 0 ? totalSpent / totalVolume : 0,
        completionRate: jobs?.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting buyer analytics:', error);
      throw error;
    }
  },

  // Get trends data
  getTrends: async (metric: string, period: string): Promise<any[]> => {
    try {
      // Mock trends data
      const trends = [];
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trends.push({
          date: date.toISOString().split('T')[0],
          value: Math.floor(Math.random() * 100) + 50, // Mock data
          jobs: Math.floor(Math.random() * 20) + 5,
          volume: Math.floor(Math.random() * 1000) + 200,
          revenue: Math.floor(Math.random() * 5000) + 1000
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting trends:', error);
      throw error;
    }
  },

  // Get leaderboard data
  getLeaderboard: async (type: 'drivers' | 'suppliers' | 'buyers', limit: number = 10): Promise<any[]> => {
    try {
      // Mock leaderboard data
      const mockData = {
        drivers: [
          { name: 'John Doe', jobs: 45, earnings: 2500, rating: 4.8 },
          { name: 'Jane Smith', jobs: 38, earnings: 2100, rating: 4.7 },
          { name: 'Mike Johnson', jobs: 42, earnings: 2300, rating: 4.6 }
        ],
        suppliers: [
          { name: 'The Golden Spoon', volume: 1200, jobs: 25, rating: 4.5 },
          { name: 'Bella Italia', volume: 980, jobs: 22, rating: 4.4 },
          { name: 'Pizza Express', volume: 850, jobs: 18, rating: 4.3 }
        ],
        buyers: [
          { name: 'BioFuel Solutions', volume: 5000, spent: 15000, jobs: 50 },
          { name: 'Green Energy Co', volume: 3200, spent: 9600, jobs: 32 },
          { name: 'EcoFuel Ltd', volume: 2800, spent: 8400, jobs: 28 }
        ]
      };

      return mockData[type]?.slice(0, limit) || [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
};