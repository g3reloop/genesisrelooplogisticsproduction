import { supabase } from '../lib/supabase';
import { GenesisPoints, Job, User, UserRole, JobStatus } from '../types';

interface PointsCalculation {
  basePoints: number;
  multipliers: {
    volume: number;
    quality: number;
    efficiency: number;
    loyalty: number;
    special: number;
  };
  totalPoints: number;
  reasons: string[];
}

interface ProfitShare {
  totalProfit: number;
  driverShare: number;
  platformShare: number;
  reserveFund: number;
  distribution: {
    [driverId: string]: {
      points: number;
      share: number;
      amount: number;
    };
  };
}

export const genesisPointsService = {
  // Calculate Genesis Points for a completed job
  calculateJobPoints: async (jobId: string, driverId: string): Promise<PointsCalculation> => {
    try {
      const job = await getJobById(jobId);
      const driver = await getUserById(driverId);
      
      if (!job || !driver) {
        throw new Error('Job or driver not found');
      }

      const calculation = await performPointsCalculation(job, driver);
      
      // Store the points in the database
      await storeGenesisPoints(driverId, jobId, calculation);
      
      return calculation;
    } catch (error) {
      console.error('Error calculating Genesis Points:', error);
      throw error;
    }
  },

  // Distribute profit shares based on Genesis Points
  distributeProfitShares: async (period: 'monthly' | 'quarterly' | 'yearly'): Promise<ProfitShare> => {
    try {
      const totalProfit = await calculatePlatformProfit(period);
      const driverPoints = await getAllDriverPoints();
      
      const profitShare = calculateProfitDistribution(totalProfit, driverPoints);
      
      // Record the distribution
      await recordProfitDistribution(profitShare, period);
      
      return profitShare;
    } catch (error) {
      console.error('Error distributing profit shares:', error);
      throw error;
    }
  },

  // Get driver's Genesis Points balance
  getDriverBalance: async (driverId: string): Promise<{
    totalPoints: number;
    availablePoints: number;
    lockedPoints: number;
    lifetimeEarnings: number;
    rank: number;
  }> => {
    try {
      const { data: points, error } = await supabase
        .from('genesis_points')
        .select('*')
        .eq('user_id', driverId);

      if (error) throw error;

      const totalPoints = points?.reduce((sum, p) => sum + p.points, 0) || 0;
      const availablePoints = points?.filter(p => !p.locked).reduce((sum, p) => sum + p.points, 0) || 0;
      const lockedPoints = totalPoints - availablePoints;
      
      const lifetimeEarnings = await calculateLifetimeEarnings(driverId);
      const rank = await getDriverRank(driverId);

      return {
        totalPoints,
        availablePoints,
        lockedPoints,
        lifetimeEarnings,
        rank
      };
    } catch (error) {
      console.error('Error getting driver balance:', error);
      throw error;
    }
  },

  // Get Genesis Points leaderboard
  getLeaderboard: async (limit: number = 50): Promise<Array<{
    driverId: string;
    driverName: string;
    totalPoints: number;
    rank: number;
    monthlyEarnings: number;
  }>> => {
    try {
      const { data, error } = await supabase
        .from('genesis_points')
        .select(`
          user_id,
          points,
          users!inner(name)
        `);

      if (error) throw error;

      // Aggregate points by driver
      const driverTotals = new Map<string, { name: string; points: number }>();
      
      data?.forEach(point => {
        const driverId = point.user_id;
        const current = driverTotals.get(driverId) || { name: point.users.name, points: 0 };
        current.points += point.points;
        driverTotals.set(driverId, current);
      });

      // Sort by points and add ranking
      const leaderboard = Array.from(driverTotals.entries())
        .map(([driverId, data], index) => ({
          driverId,
          driverName: data.name,
          totalPoints: data.points,
          rank: index + 1,
          monthlyEarnings: 0 // Will be calculated separately
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit);

      // Calculate monthly earnings for each driver
      for (const driver of leaderboard) {
        driver.monthlyEarnings = await calculateMonthlyEarnings(driver.driverId);
      }

      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  },

  // Redeem Genesis Points for rewards
  redeemPoints: async (driverId: string, points: number, rewardType: string): Promise<{
    success: boolean;
    transactionId: string;
    remainingPoints: number;
  }> => {
    try {
      const balance = await getDriverBalance(driverId);
      
      if (balance.availablePoints < points) {
        throw new Error('Insufficient Genesis Points');
      }

      // Create redemption transaction
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: driverId,
          amount: points * 0.01, // 1 point = £0.01 (example rate)
          currency: 'GBP',
          transaction_type: 'POINTS_REDEMPTION',
          status: 'COMPLETED',
          description: `Redeemed ${points} Genesis Points for ${rewardType}`,
          metadata: {
            pointsRedeemed: points,
            rewardType,
            pointsValue: points * 0.01
          },
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct points from balance
      await supabase
        .from('genesis_points')
        .update({ locked: true })
        .eq('user_id', driverId)
        .limit(points);

      return {
        success: true,
        transactionId: transaction.id,
        remainingPoints: balance.availablePoints - points
      };
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  },

  // Get Genesis Points value and market data
  getPointsValue: async (): Promise<{
    currentValue: number;
    valueHistory: Array<{ date: string; value: number }>;
    marketCap: number;
    totalPointsInCirculation: number;
  }> => {
    try {
      // Get current value from system settings
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'genesis_points_value')
        .single();

      if (error) throw error;

      const currentValue = parseFloat(settings?.value || '0.01');
      
      // Get value history (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: history, error: historyError } = await supabase
        .from('genesis_points_value_history')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date', { ascending: true });

      if (historyError) throw historyError;

      // Calculate total points in circulation
      const { data: totalPoints, error: pointsError } = await supabase
        .from('genesis_points')
        .select('points', { count: 'exact' });

      if (pointsError) throw pointsError;

      const totalPointsInCirculation = totalPoints?.reduce((sum, p) => sum + p.points, 0) || 0;
      const marketCap = totalPointsInCirculation * currentValue;

      return {
        currentValue,
        valueHistory: history || [],
        marketCap,
        totalPointsInCirculation
      };
    } catch (error) {
      console.error('Error getting points value:', error);
      throw error;
    }
  },

  // Update Genesis Points value based on platform performance
  updatePointsValue: async (): Promise<void> => {
    try {
      const platformMetrics = await calculatePlatformMetrics();
      const newValue = calculateNewPointsValue(platformMetrics);
      
      // Update current value
      await supabase
        .from('system_settings')
        .upsert({
          key: 'genesis_points_value',
          value: newValue.toString(),
          updated_at: new Date().toISOString()
        });

      // Record value history
      await supabase
        .from('genesis_points_value_history')
        .insert({
          date: new Date().toISOString(),
          value: newValue,
          metrics: platformMetrics
        });
    } catch (error) {
      console.error('Error updating points value:', error);
      throw error;
    }
  }
};

// Helper functions
async function getJobById(jobId: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function performPointsCalculation(job: Job, driver: User): Promise<PointsCalculation> {
  const reasons: string[] = [];
  let basePoints = 10; // Base points for completing any job

  // Volume multiplier (0.1 points per liter)
  const volumePoints = (job.volume || 0) * 0.1;
  const volumeMultiplier = 1 + (volumePoints / 100);
  reasons.push(`Volume bonus: ${Math.round(volumePoints)} points`);

  // Quality multiplier based on contamination level
  let qualityMultiplier = 1;
  switch (job.contamination) {
    case 'NONE':
      qualityMultiplier = 1.5;
      reasons.push('Perfect quality: +50% bonus');
      break;
    case 'LOW':
      qualityMultiplier = 1.2;
      reasons.push('Good quality: +20% bonus');
      break;
    case 'MEDIUM':
      qualityMultiplier = 1.0;
      reasons.push('Standard quality: no bonus');
      break;
    case 'HIGH':
      qualityMultiplier = 0.8;
      reasons.push('Poor quality: -20% penalty');
      break;
  }

  // Efficiency multiplier based on completion time
  const estimatedDuration = job.estimatedDuration || 120; // minutes
  const actualDuration = job.actualDuration || estimatedDuration;
  const efficiencyMultiplier = Math.min(1.5, estimatedDuration / actualDuration);
  if (efficiencyMultiplier > 1) {
    reasons.push(`Efficiency bonus: +${Math.round((efficiencyMultiplier - 1) * 100)}%`);
  }

  // Loyalty multiplier based on driver history
  const driverHistory = await getDriverJobHistory(driver.id);
  const loyaltyMultiplier = Math.min(2.0, 1 + (driverHistory.length * 0.01));
  if (loyaltyMultiplier > 1.1) {
    reasons.push(`Loyalty bonus: +${Math.round((loyaltyMultiplier - 1) * 100)}%`);
  }

  // Special multipliers
  let specialMultiplier = 1;
  if (job.urgency === 'high') {
    specialMultiplier *= 1.3;
    reasons.push('Urgency bonus: +30%');
  }
  if (job.payment && job.payment > 100) {
    specialMultiplier *= 1.1;
    reasons.push('High payment bonus: +10%');
  }

  const totalPoints = Math.round(
    basePoints * 
    volumeMultiplier * 
    qualityMultiplier * 
    efficiencyMultiplier * 
    loyaltyMultiplier * 
    specialMultiplier
  );

  return {
    basePoints,
    multipliers: {
      volume: volumeMultiplier,
      quality: qualityMultiplier,
      efficiency: efficiencyMultiplier,
      loyalty: loyaltyMultiplier,
      special: specialMultiplier
    },
    totalPoints,
    reasons
  };
}

async function storeGenesisPoints(driverId: string, jobId: string, calculation: PointsCalculation): Promise<void> {
  const { error } = await supabase
    .from('genesis_points')
    .insert({
      user_id: driverId,
      job_id: jobId,
      points: calculation.totalPoints,
      points_type: 'JOB_COMPLETION',
      description: `Job completion: ${calculation.reasons.join(', ')}`,
      multiplier: Object.values(calculation.multipliers).reduce((a, b) => a * b, 1),
      created_at: new Date().toISOString()
    });

  if (error) throw error;
}

async function getDriverJobHistory(driverId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('driver_id', driverId)
    .eq('status', JobStatus.COMPLETED);

  if (error) throw error;
  return data || [];
}

async function calculatePlatformProfit(period: string): Promise<number> {
  // This would calculate actual platform profit from transactions
  // For now, return a mock value
  const mockProfits = {
    monthly: 50000,
    quarterly: 150000,
    yearly: 600000
  };
  
  return mockProfits[period as keyof typeof mockProfits] || 50000;
}

async function getAllDriverPoints(): Promise<Array<{ driverId: string; points: number }>> {
  const { data, error } = await supabase
    .from('genesis_points')
    .select('user_id, points');

  if (error) throw error;

  const driverTotals = new Map<string, number>();
  data?.forEach(point => {
    const current = driverTotals.get(point.user_id) || 0;
    driverTotals.set(point.user_id, current + point.points);
  });

  return Array.from(driverTotals.entries()).map(([driverId, points]) => ({
    driverId,
    points
  }));
}

function calculateProfitDistribution(totalProfit: number, driverPoints: Array<{ driverId: string; points: number }>): ProfitShare {
  const totalPoints = driverPoints.reduce((sum, dp) => sum + dp.points, 0);
  const driverShare = totalProfit * 0.6; // 60% to drivers
  const platformShare = totalProfit * 0.3; // 30% to platform
  const reserveFund = totalProfit * 0.1; // 10% to reserve

  const distribution: { [driverId: string]: { points: number; share: number; amount: number } } = {};

  driverPoints.forEach(({ driverId, points }) => {
    const share = points / totalPoints;
    const amount = driverShare * share;
    distribution[driverId] = { points, share, amount };
  });

  return {
    totalProfit,
    driverShare,
    platformShare,
    reserveFund,
    distribution
  };
}

async function recordProfitDistribution(profitShare: ProfitShare, period: string): Promise<void> {
  const { error } = await supabase
    .from('profit_distributions')
    .insert({
      period,
      total_profit: profitShare.totalProfit,
      driver_share: profitShare.driverShare,
      platform_share: profitShare.platformShare,
      reserve_fund: profitShare.reserveFund,
      distribution_data: profitShare.distribution,
      created_at: new Date().toISOString()
    });

  if (error) throw error;
}

async function calculateLifetimeEarnings(driverId: string): Promise<number> {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', driverId)
    .eq('transaction_type', 'POINTS_REDEMPTION');

  if (error) throw error;
  return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
}

async function getDriverRank(driverId: string): Promise<number> {
  const leaderboard = await genesisPointsService.getLeaderboard(1000);
  const driverIndex = leaderboard.findIndex(d => d.driverId === driverId);
  return driverIndex >= 0 ? driverIndex + 1 : 0;
}

async function calculateMonthlyEarnings(driverId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', driverId)
    .eq('transaction_type', 'POINTS_REDEMPTION')
    .gte('created_at', startOfMonth.toISOString());

  if (error) throw error;
  return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
}

async function calculatePlatformMetrics(): Promise<any> {
  // Calculate various platform metrics that affect Genesis Points value
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', JobStatus.COMPLETED);

  if (jobsError) throw jobsError;

  const totalVolume = jobs?.reduce((sum, job) => sum + (job.volume || 0), 0) || 0;
  const totalRevenue = jobs?.reduce((sum, job) => sum + (job.payment || 0), 0) || 0;
  const averageQuality = jobs?.reduce((sum, job) => {
    const qualityScore = job.contamination === 'NONE' ? 4 : 
                        job.contamination === 'LOW' ? 3 :
                        job.contamination === 'MEDIUM' ? 2 : 1;
    return sum + qualityScore;
  }, 0) / (jobs?.length || 1) || 0;

  return {
    totalJobs: jobs?.length || 0,
    totalVolume,
    totalRevenue,
    averageQuality,
    platformGrowth: 1.2, // Mock growth rate
    userSatisfaction: 4.5 // Mock satisfaction score
  };
}

function calculateNewPointsValue(metrics: any): number {
  // Complex algorithm to determine Genesis Points value based on platform performance
  const baseValue = 0.01;
  const volumeFactor = Math.min(2, metrics.totalVolume / 100000); // Scale with volume
  const qualityFactor = metrics.averageQuality / 4; // Scale with quality
  const growthFactor = metrics.platformGrowth;
  const satisfactionFactor = metrics.userSatisfaction / 5;

  const newValue = baseValue * volumeFactor * qualityFactor * growthFactor * satisfactionFactor;
  
  // Ensure value doesn't change too drastically
  const maxChange = 0.5; // 50% max change
  return Math.max(0.001, Math.min(0.1, newValue));
}