import { supabase } from '../lib/supabase';
import { GenesisPoints, Job, User } from '../types';

class GenesisPointsService {
  private pointsPerLitre: number = 2;
  private bonusMultipliers: Record<string, number> = {
    'quality_bonus': 1.2,
    'speed_bonus': 1.1,
    'volume_bonus': 1.15,
    'referral_bonus': 1.0,
    'loyalty_bonus': 1.05,
  };

  // Calculate Genesis Points for a job
  calculateJobPoints(
    job: Job,
    qualityScore: number = 1.0,
    speedScore: number = 1.0,
    volumeScore: number = 1.0
  ): number {
    const basePoints = job.volume * this.pointsPerLitre;
    
    // Apply quality multiplier
    const qualityMultiplier = Math.min(qualityScore, 1.5); // Cap at 1.5x
    
    // Apply speed multiplier
    const speedMultiplier = Math.min(speedScore, 1.3); // Cap at 1.3x
    
    // Apply volume multiplier for large jobs
    const volumeMultiplier = job.volume > 100 ? this.bonusMultipliers.volume_bonus : 1.0;
    
    // Calculate final points
    const finalPoints = Math.round(
      basePoints * qualityMultiplier * speedMultiplier * volumeMultiplier
    );
    
    return finalPoints;
  }

  // Award Genesis Points for job completion
  async awardJobPoints(
    userId: string,
    jobId: string,
    points: number,
    description: string = 'Job completion'
  ): Promise<GenesisPoints> {
    try {
      const { data, error } = await supabase
        .from('genesis_points')
        .insert({
          user_id: userId,
          job_id: jobId,
          points,
          points_type: 'JOB_COMPLETION',
          description,
          multiplier: 1.0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update user's total Genesis Points
      await this.updateUserTotalPoints(userId);

      return data;
    } catch (error: any) {
      throw new Error(`Failed to award Genesis Points: ${error.message}`);
    }
  }

  // Award bonus points
  async awardBonusPoints(
    userId: string,
    points: number,
    bonusType: string,
    description: string,
    jobId?: string
  ): Promise<GenesisPoints> {
    try {
      const multiplier = this.bonusMultipliers[bonusType] || 1.0;
      const finalPoints = Math.round(points * multiplier);

      const { data, error } = await supabase
        .from('genesis_points')
        .insert({
          user_id: userId,
          job_id: jobId,
          points: finalPoints,
          points_type: bonusType.toUpperCase(),
          description,
          multiplier,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update user's total Genesis Points
      await this.updateUserTotalPoints(userId);

      return data;
    } catch (error: any) {
      throw new Error(`Failed to award bonus points: ${error.message}`);
    }
  }

  // Award referral points
  async awardReferralPoints(
    referrerId: string,
    referredId: string,
    points: number = 100
  ): Promise<GenesisPoints> {
    try {
      const { data, error } = await supabase
        .from('genesis_points')
        .insert({
          user_id: referrerId,
          points,
          points_type: 'REFERRAL',
          description: `Referral bonus for referring user ${referredId}`,
          multiplier: this.bonusMultipliers.referral_bonus,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update user's total Genesis Points
      await this.updateUserTotalPoints(referrerId);

      return data;
    } catch (error: any) {
      throw new Error(`Failed to award referral points: ${error.message}`);
    }
  }

  // Get user's Genesis Points
  async getUserPoints(userId: string): Promise<{
    totalPoints: number;
    availablePoints: number;
    usedPoints: number;
    pointsHistory: GenesisPoints[];
  }> {
    try {
      // Get all points for user
      const { data: pointsData, error: pointsError } = await supabase
        .from('genesis_points')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (pointsError) {
        throw new Error(pointsError.message);
      }

      const pointsHistory = pointsData || [];
      const totalPoints = pointsHistory.reduce((sum, point) => sum + point.points, 0);
      
      // For now, all points are available (no spending system implemented yet)
      const availablePoints = totalPoints;
      const usedPoints = 0;

      return {
        totalPoints,
        availablePoints,
        usedPoints,
        pointsHistory,
      };
    } catch (error: any) {
      throw new Error(`Failed to get user points: ${error.message}`);
    }
  }

  // Get points leaderboard
  async getLeaderboard(limit: number = 10): Promise<{
    userId: string;
    userName: string;
    totalPoints: number;
    rank: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('genesis_points')
        .select(`
          user_id,
          points,
          users!genesis_points_user_id_fkey(name)
        `);

      if (error) {
        throw new Error(error.message);
      }

      // Group by user and calculate totals
      const userPoints = new Map<string, { name: string; totalPoints: number }>();
      
      data?.forEach((point) => {
        const userId = point.user_id;
        const current = userPoints.get(userId) || { name: point.users?.name || 'Unknown', totalPoints: 0 };
        userPoints.set(userId, {
          name: current.name,
          totalPoints: current.totalPoints + point.points,
        });
      });

      // Convert to array and sort
      const leaderboard = Array.from(userPoints.entries())
        .map(([userId, data], index) => ({
          userId,
          userName: data.name,
          totalPoints: data.totalPoints,
          rank: index + 1,
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit);

      return leaderboard;
    } catch (error: any) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }
  }

  // Get monthly points summary
  async getMonthlySummary(userId: string, year: number, month: number): Promise<{
    totalPoints: number;
    jobPoints: number;
    bonusPoints: number;
    referralPoints: number;
    pointsByDay: { date: string; points: number }[];
  }> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const { data, error } = await supabase
        .from('genesis_points')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const points = data || [];
      const totalPoints = points.reduce((sum, point) => sum + point.points, 0);
      
      const jobPoints = points
        .filter(p => p.points_type === 'JOB_COMPLETION')
        .reduce((sum, point) => sum + point.points, 0);
      
      const bonusPoints = points
        .filter(p => p.points_type.includes('BONUS'))
        .reduce((sum, point) => sum + point.points, 0);
      
      const referralPoints = points
        .filter(p => p.points_type === 'REFERRAL')
        .reduce((sum, point) => sum + point.points, 0);

      // Group points by day
      const pointsByDay = new Map<string, number>();
      points.forEach(point => {
        const date = point.created_at.split('T')[0];
        const current = pointsByDay.get(date) || 0;
        pointsByDay.set(date, current + point.points);
      });

      const pointsByDayArray = Array.from(pointsByDay.entries())
        .map(([date, points]) => ({ date, points }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalPoints,
        jobPoints,
        bonusPoints,
        referralPoints,
        pointsByDay: pointsByDayArray,
      };
    } catch (error: any) {
      throw new Error(`Failed to get monthly summary: ${error.message}`);
    }
  }

  // Calculate profit share for user
  async calculateProfitShare(userId: string, totalPlatformProfit: number): Promise<{
    userPoints: number;
    totalPoints: number;
    sharePercentage: number;
    profitShare: number;
  }> {
    try {
      // Get user's total points
      const userPointsData = await this.getUserPoints(userId);
      const userPoints = userPointsData.totalPoints;

      // Get total points across all users
      const { data, error } = await supabase
        .from('genesis_points')
        .select('points');

      if (error) {
        throw new Error(error.message);
      }

      const totalPoints = data?.reduce((sum, point) => sum + point.points, 0) || 1;
      const sharePercentage = (userPoints / totalPoints) * 100;
      const profitShare = (userPoints / totalPoints) * totalPlatformProfit;

      return {
        userPoints,
        totalPoints,
        sharePercentage,
        profitShare,
      };
    } catch (error: any) {
      throw new Error(`Failed to calculate profit share: ${error.message}`);
    }
  }

  // Update user's total Genesis Points
  private async updateUserTotalPoints(userId: string): Promise<void> {
    try {
      const userPointsData = await this.getUserPoints(userId);
      
      // Update driver profile if user is a driver
      const { error: driverError } = await supabase
        .from('driver_profiles')
        .update({ genesis_points: userPointsData.totalPoints })
        .eq('user_id', userId);

      if (driverError) {
        console.error('Error updating driver profile points:', driverError);
      }
    } catch (error) {
      console.error('Error updating user total points:', error);
    }
  }

  // Get points value in GBP
  async getPointsValue(points: number): Promise<number> {
    try {
      // Get current points value from system settings
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'genesis_points_value_gbp')
        .single();

      if (error) {
        // Default value if not set
        return points * 0.21; // £0.21 per point
      }

      const pointsValue = data.value as number;
      return points * pointsValue;
    } catch (error) {
      console.error('Error getting points value:', error);
      return points * 0.21; // Default fallback
    }
  }

  // Set points value
  async setPointsValue(valuePerPoint: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'genesis_points_value_gbp',
          value: valuePerPoint,
          description: 'Genesis Points value in GBP',
        });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(`Failed to set points value: ${error.message}`);
    }
  }

  // Get points statistics
  async getPointsStatistics(): Promise<{
    totalPointsAwarded: number;
    totalUsers: number;
    averagePointsPerUser: number;
    pointsAwardedToday: number;
    pointsAwardedThisMonth: number;
  }> {
    try {
      // Get total points awarded
      const { data: totalPointsData, error: totalError } = await supabase
        .from('genesis_points')
        .select('points');

      if (totalError) {
        throw new Error(totalError.message);
      }

      const totalPointsAwarded = totalPointsData?.reduce((sum, point) => sum + point.points, 0) || 0;

      // Get unique users
      const { data: usersData, error: usersError } = await supabase
        .from('genesis_points')
        .select('user_id')
        .not('user_id', 'is', null);

      if (usersError) {
        throw new Error(usersError.message);
      }

      const uniqueUsers = new Set(usersData?.map(p => p.user_id) || []);
      const totalUsers = uniqueUsers.size;
      const averagePointsPerUser = totalUsers > 0 ? totalPointsAwarded / totalUsers : 0;

      // Get today's points
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayData, error: todayError } = await supabase
        .from('genesis_points')
        .select('points')
        .gte('created_at', today.toISOString());

      if (todayError) {
        throw new Error(todayError.message);
      }

      const pointsAwardedToday = todayData?.reduce((sum, point) => sum + point.points, 0) || 0;

      // Get this month's points
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { data: monthData, error: monthError } = await supabase
        .from('genesis_points')
        .select('points')
        .gte('created_at', monthStart.toISOString());

      if (monthError) {
        throw new Error(monthError.message);
      }

      const pointsAwardedThisMonth = monthData?.reduce((sum, point) => sum + point.points, 0) || 0;

      return {
        totalPointsAwarded,
        totalUsers,
        averagePointsPerUser,
        pointsAwardedToday,
        pointsAwardedThisMonth,
      };
    } catch (error: any) {
      throw new Error(`Failed to get points statistics: ${error.message}`);
    }
  }
}

// Export singleton instance
export const genesisPointsService = new GenesisPointsService();
