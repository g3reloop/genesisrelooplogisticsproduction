import { supabase } from '../lib/supabase';
import { DWTNRecord, Job, JobStatus } from '../types';
import { blockchainService } from './blockchainService';

export const complianceService = {
  // Generate compliance report
  generateComplianceReport: async (startDate: string, endDate: string): Promise<any> => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', JobStatus.COMPLETED)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate);

      if (error) throw error;

      const totalJobs = jobs?.length || 0;
      const compliantJobs = jobs?.filter(job => job.complianceStatus === 'compliant').length || 0;
      const complianceRate = totalJobs > 0 ? (compliantJobs / totalJobs) * 100 : 0;

      return {
        reportId: `COMP-${Date.now()}`,
        period: { start: startDate, end: endDate },
        generatedAt: new Date().toISOString(),
        summary: {
          totalTransfers: totalJobs,
          compliantTransfers: compliantJobs,
          nonCompliantTransfers: totalJobs - compliantJobs,
          complianceRate: Math.round(complianceRate),
          totalVolume: jobs?.reduce((sum, job) => sum + (job.volume || 0), 0) || 0,
          totalValue: jobs?.reduce((sum, job) => sum + (job.payment || 0), 0) || 0
        },
        violations: [],
        recommendations: []
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  },

  // Verify DWTN compliance
  verifyDWTNCompliance: async (dwtnRecord: DWTNRecord): Promise<{
    compliant: boolean;
    issues: string[];
    score: number;
    recommendations: string[];
  }> => {
    try {
      const issues: string[] = [];
      let score = 100;

      // Basic validation checks
      if (!dwtnRecord.supplierDetails?.name) {
        issues.push('Missing supplier details');
        score -= 20;
      }
      if (!dwtnRecord.driverDetails?.name) {
        issues.push('Missing driver details');
        score -= 20;
      }
      if (!dwtnRecord.buyerDetails?.name) {
        issues.push('Missing buyer details');
        score -= 20;
      }
      if (!dwtnRecord.wasteDetails?.volume || dwtnRecord.wasteDetails.volume <= 0) {
        issues.push('Invalid waste volume');
        score -= 20;
      }

      const compliant = score >= 70 && issues.length === 0;
      const recommendations = issues.length > 0 ? ['Review and correct the identified issues'] : [];

      return {
        compliant,
        issues,
        score: Math.max(0, score),
        recommendations
      };
    } catch (error) {
      console.error('Error verifying DWTN compliance:', error);
      throw error;
    }
  },

  // Monitor regulatory changes
  monitorRegulatoryChanges: async (): Promise<any[]> => {
    try {
      const mockUpdates = [
        {
          title: 'New EU UCO Traceability Requirements',
          description: 'Enhanced documentation requirements for UCO collection',
          effectiveDate: '2024-06-01',
          impact: 'high',
          affectedUsers: ['suppliers', 'drivers', 'buyers']
        }
      ];

      return mockUpdates;
    } catch (error) {
      console.error('Error monitoring regulatory changes:', error);
      throw error;
    }
  },

  // Get compliance dashboard
  getComplianceDashboard: async (): Promise<any> => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', JobStatus.COMPLETED)
        .gte('completed_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const totalJobs = jobs?.length || 0;
      const compliantJobs = jobs?.filter(job => job.complianceStatus === 'compliant').length || 0;
      const overallCompliance = totalJobs > 0 ? (compliantJobs / totalJobs) * 100 : 0;

      return {
        overallCompliance: Math.round(overallCompliance),
        recentViolations: 0,
        pendingAudits: 0,
        regulatoryUpdates: 1,
        trends: []
      };
    } catch (error) {
      console.error('Error getting compliance dashboard:', error);
      throw error;
    }
  }
};