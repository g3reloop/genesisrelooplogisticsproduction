import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ServiceType, SubscriptionStatus, AlertSeverity } from '../types';
import { stripeSubscriptionService } from '../services/stripeSubscriptionService';
import { aiService } from '../services/aiService';
import { Button } from '../components/common/Button';
import { toast } from 'react-hot-toast';

interface ServiceDashboardProps {
  serviceType: ServiceType;
}

export const ServiceDashboardPage: React.FC<ServiceDashboardProps> = ({ serviceType }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [insights, setInsights] = useState<string>('');

  useEffect(() => {
    loadSubscriptionData();
  }, [serviceType]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from Supabase
      const mockSubscription = {
        id: '1',
        serviceType,
        status: SubscriptionStatus.ACTIVE,
        priceMonthly: getServicePrice(serviceType),
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      setSubscription(mockSubscription);
      
      // Load service-specific data
      await loadServiceData(serviceType);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceData = async (service: ServiceType) => {
    switch (service) {
      case ServiceType.ISCC_COMPLIANCE:
        await loadISCCData();
        break;
      case ServiceType.MASS_BALANCE:
        await loadMassBalanceData();
        break;
      case ServiceType.FRAUD_PREVENTION:
        await loadFraudPreventionData();
        break;
      case ServiceType.AUTOMATED_DOCS:
        await loadAutomatedDocsData();
        break;
    }
  };

  const loadISCCData = async () => {
    // Mock ISCC compliance data
    setData({
      complianceScore: 95,
      lastAudit: '2024-01-15',
      nextAudit: '2024-04-15',
      violations: 0,
      certificates: [
        { id: '1', name: 'ISCC Certificate 2024', status: 'Valid', expires: '2024-12-31' },
        { id: '2', name: 'Sustainability Declaration', status: 'Valid', expires: '2024-12-31' }
      ],
      recentActivities: [
        { date: '2024-01-20', action: 'Certificate renewed', status: 'Success' },
        { date: '2024-01-15', action: 'Compliance audit completed', status: 'Passed' }
      ]
    });
  };

  const loadMassBalanceData = async () => {
    // Mock mass balance data
    const mockData = {
      currentPeriod: {
        input: 1000,
        output: 950,
        waste: 50,
        efficiency: 95
      },
      monthlyData: [
        { month: 'Jan', input: 1000, output: 950, efficiency: 95 },
        { month: 'Feb', input: 1200, output: 1140, efficiency: 95 },
        { month: 'Mar', input: 1100, output: 1045, efficiency: 95 }
      ],
      trends: {
        efficiency: 'increasing',
        waste: 'decreasing',
        output: 'stable'
      }
    };
    setData(mockData);

    // Generate AI insights
    try {
      const insights = await aiService.generateMassBalanceInsights('user1', [
        { date: '2024-01-01', input: 1000, output: 950, waste: 50 },
        { date: '2024-01-02', input: 1200, output: 1140, waste: 60 }
      ]);
      setInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  };

  const loadFraudPreventionData = async () => {
    // Mock fraud prevention data
    setData({
      riskLevel: 'LOW',
      totalAlerts: 3,
      resolvedAlerts: 2,
      activeAlerts: 1,
      recentAlerts: [
        { id: '1', type: 'Unusual Volume', severity: AlertSeverity.MEDIUM, date: '2024-01-20', resolved: false },
        { id: '2', type: 'Location Mismatch', severity: AlertSeverity.LOW, date: '2024-01-18', resolved: true }
      ],
      riskFactors: [
        { factor: 'Transaction Volume', score: 25, status: 'Normal' },
        { factor: 'Location Patterns', score: 15, status: 'Normal' },
        { factor: 'Timing Patterns', score: 30, status: 'Suspicious' }
      ]
    });
  };

  const loadAutomatedDocsData = async () => {
    // Mock automated docs data
    setData({
      totalDocuments: 45,
      generatedThisMonth: 12,
      pendingApproval: 3,
      recentDocuments: [
        { id: '1', name: 'ISCC Compliance Report - Q1 2024', type: 'Compliance', generated: '2024-01-20', status: 'Approved' },
        { id: '2', name: 'Mass Balance Report - January', type: 'Report', generated: '2024-01-19', status: 'Pending' },
        { id: '3', name: 'Waste Transfer Note - Batch 001', type: 'Transfer Note', generated: '2024-01-18', status: 'Approved' }
      ],
      templates: [
        { id: '1', name: 'ISCC Compliance Report', usage: 15, lastUsed: '2024-01-20' },
        { id: '2', name: 'Mass Balance Report', usage: 8, lastUsed: '2024-01-19' },
        { id: '3', name: 'Waste Transfer Note', usage: 22, lastUsed: '2024-01-18' }
      ]
    });
  };

  const getServicePrice = (service: ServiceType): number => {
    const prices = {
      [ServiceType.ISCC_COMPLIANCE]: 150,
      [ServiceType.MASS_BALANCE]: 100,
      [ServiceType.FRAUD_PREVENTION]: 200,
      [ServiceType.AUTOMATED_DOCS]: 300
    };
    return prices[service] || 0;
  };

  const getServiceName = (service: ServiceType): string => {
    const names = {
      [ServiceType.ISCC_COMPLIANCE]: 'ISCC Compliance Verification',
      [ServiceType.MASS_BALANCE]: 'Mass Balance Monitoring',
      [ServiceType.FRAUD_PREVENTION]: 'Fraud Prevention System',
      [ServiceType.AUTOMATED_DOCS]: 'Automated Documentation'
    };
    return names[service] || 'Unknown Service';
  };

  const getServiceIcon = (service: ServiceType): string => {
    const icons = {
      [ServiceType.ISCC_COMPLIANCE]: '📋',
      [ServiceType.MASS_BALANCE]: '⚖️',
      [ServiceType.FRAUD_PREVENTION]: '🛡️',
      [ServiceType.AUTOMATED_DOCS]: '📄'
    };
    return icons[service] || '❓';
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      await stripeSubscriptionService.cancelSubscription(subscription.id);
      setSubscription(prev => ({ ...prev, status: SubscriptionStatus.CANCELLED }));
      toast.success('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handlePauseSubscription = async () => {
    if (!subscription) return;

    try {
      await stripeSubscriptionService.pauseSubscription(subscription.id);
      setSubscription(prev => ({ ...prev, status: SubscriptionStatus.PAUSED }));
      toast.success('Subscription paused successfully');
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('Failed to pause subscription');
    }
  };

  const renderISCCDashboard = () => (
    <div className="space-y-6">
      {/* Compliance Score */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data?.complianceScore}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{data?.violations}</div>
            <div className="text-sm text-gray-600">Active Violations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{data?.certificates?.length || 0}</div>
            <div className="text-sm text-gray-600">Valid Certificates</div>
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificates</h3>
        <div className="space-y-3">
          {data?.certificates?.map((cert: any) => (
            <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{cert.name}</div>
                <div className="text-sm text-gray-600">Expires: {cert.expires}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cert.status === 'Valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {cert.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMassBalanceDashboard = () => (
    <div className="space-y-6">
      {/* Current Period Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Period</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data?.currentPeriod?.input}L</div>
            <div className="text-sm text-gray-600">Input</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{data?.currentPeriod?.output}L</div>
            <div className="text-sm text-gray-600">Output</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{data?.currentPeriod?.waste}L</div>
            <div className="text-sm text-gray-600">Waste</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data?.currentPeriod?.efficiency}%</div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Insights</h3>
          <p className="text-blue-800">{insights}</p>
        </div>
      )}

      {/* Monthly Data Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
        <div className="space-y-3">
          {data?.monthlyData?.map((month: any) => (
            <div key={month.month} className="flex items-center justify-between">
              <div className="font-medium">{month.month}</div>
              <div className="flex items-center space-x-4 text-sm">
                <span>Input: {month.input}L</span>
                <span>Output: {month.output}L</span>
                <span className="font-medium">Efficiency: {month.efficiency}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFraudPreventionDashboard = () => (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${
              data?.riskLevel === 'LOW' ? 'text-green-600' : 
              data?.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {data?.riskLevel}
            </div>
            <div className="text-sm text-gray-600">Risk Level</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{data?.totalAlerts}</div>
            <div className="text-sm text-gray-600">Total Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data?.resolvedAlerts}</div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {data?.recentAlerts?.map((alert: any) => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{alert.type}</div>
                <div className="text-sm text-gray-600">{alert.date}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.severity === AlertSeverity.HIGH ? 'bg-red-100 text-red-800' :
                  alert.severity === AlertSeverity.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {alert.severity}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {alert.resolved ? 'Resolved' : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAutomatedDocsDashboard = () => (
    <div className="space-y-6">
      {/* Document Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{data?.totalDocuments}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{data?.generatedThisMonth}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{data?.pendingApproval}</div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Documents</h3>
        <div className="space-y-3">
          {data?.recentDocuments?.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{doc.name}</div>
                <div className="text-sm text-gray-600">{doc.type} • {doc.generated}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                doc.status === 'Approved' ? 'bg-green-100 text-green-800' :
                doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    switch (serviceType) {
      case ServiceType.ISCC_COMPLIANCE:
        return renderISCCDashboard();
      case ServiceType.MASS_BALANCE:
        return renderMassBalanceDashboard();
      case ServiceType.FRAUD_PREVENTION:
        return renderFraudPreventionDashboard();
      case ServiceType.AUTOMATED_DOCS:
        return renderAutomatedDocsDashboard();
      default:
        return <div>Unknown service type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-4xl mr-4">{getServiceIcon(serviceType)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getServiceName(serviceType)}
                </h1>
                <p className="text-gray-600">Service Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">£{subscription?.priceMonthly}/month</div>
                <div className={`text-sm ${
                  subscription?.status === SubscriptionStatus.ACTIVE ? 'text-green-600' :
                  subscription?.status === SubscriptionStatus.PAUSED ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {subscription?.status?.replace('_', ' ').toLowerCase()}
                </div>
              </div>
              <div className="flex space-x-2">
                {subscription?.status === SubscriptionStatus.ACTIVE && (
                  <Button onClick={handlePauseSubscription} variant="outline" size="sm">
                    Pause
                  </Button>
                )}
                {subscription?.status === SubscriptionStatus.PAUSED && (
                  <Button onClick={() => stripeSubscriptionService.resumeSubscription(subscription.id)} variant="outline" size="sm">
                    Resume
                  </Button>
                )}
                <Button onClick={handleCancelSubscription} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {renderDashboard()}
      </div>
    </div>
  );
};
