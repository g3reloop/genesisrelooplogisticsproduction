import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { DWTNStatus } from '../types';
import { blockchainService } from '../services/blockchainService';
import { aiService } from '../services/aiService';
import { toast } from 'react-hot-toast';

interface ProcessorData {
  id: string;
  name: string;
  address: string;
  license: string;
  capacity: number;
  currentVolume: number;
  apiKey: string;
  webhookUrl: string;
  isConnected: boolean;
}

interface DWTNDelivery {
  id: string;
  tokenId: number;
  batchId: string;
  volume: number;
  collectionTime: string;
  deliveryTime: string;
  supplier: string;
  driver: string;
  status: DWTNStatus;
  qualityData?: any;
}

interface MassBalanceData {
  date: string;
  input: number;
  output: number;
  waste: number;
  efficiency: number;
}

export const ProcessorHubPage: React.FC = () => {
  const [processorData, setProcessorData] = useState<ProcessorData | null>(null);
  const [deliveries, setDeliveries] = useState<DWTNDelivery[]>([]);
  const [massBalanceData, setMassBalanceData] = useState<MassBalanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'mass-balance' | 'api' | 'settings'>('overview');
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  useEffect(() => {
    loadProcessorData();
    loadDeliveries();
    loadMassBalanceData();
  }, []);

  const loadProcessorData = async () => {
    try {
      setIsLoading(true);
      // Mock processor data - in production, fetch from Supabase
      const mockData: ProcessorData = {
        id: 'proc_123',
        name: 'BioFuel Plant Ltd',
        address: '123 Industrial Estate, London, UK',
        license: 'BF123456',
        capacity: 10000,
        currentVolume: 7500,
        apiKey: 'pk_live_1234567890abcdef',
        webhookUrl: 'https://biofuel-plant.com/webhook',
        isConnected: true
      };
      setProcessorData(mockData);
      setApiKey(mockData.apiKey);
      setWebhookUrl(mockData.webhookUrl);
    } catch (error) {
      console.error('Error loading processor data:', error);
      toast.error('Failed to load processor data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveries = async () => {
    try {
      // Mock deliveries data
      const mockDeliveries: DWTNDelivery[] = [
        {
          id: '1',
          tokenId: 1,
          batchId: 'DWTN-123456',
          volume: 100,
          collectionTime: '2024-01-20T10:00:00Z',
          deliveryTime: '2024-01-20T14:00:00Z',
          supplier: 'Restaurant ABC',
          driver: 'Driver XYZ',
          status: DWTNStatus.DELIVERED,
          qualityData: { ph: 6.5, temperature: 25, contamination: 'LOW' }
        },
        {
          id: '2',
          tokenId: 2,
          batchId: 'DWTN-123457',
          volume: 150,
          collectionTime: '2024-01-21T09:00:00Z',
          deliveryTime: '2024-01-21T13:00:00Z',
          supplier: 'Restaurant DEF',
          driver: 'Driver ABC',
          status: DWTNStatus.VERIFIED,
          qualityData: { ph: 6.8, temperature: 24, contamination: 'NONE' }
        }
      ];
      setDeliveries(mockDeliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast.error('Failed to load deliveries');
    }
  };

  const loadMassBalanceData = async () => {
    try {
      // Mock mass balance data
      const mockData: MassBalanceData[] = [
        { date: '2024-01-01', input: 1000, output: 950, waste: 50, efficiency: 95 },
        { date: '2024-01-02', input: 1200, output: 1140, waste: 60, efficiency: 95 },
        { date: '2024-01-03', input: 1100, output: 1045, waste: 55, efficiency: 95 },
        { date: '2024-01-04', input: 1300, output: 1235, waste: 65, efficiency: 95 },
        { date: '2024-01-05', input: 1150, output: 1092.5, waste: 57.5, efficiency: 95 }
      ];
      setMassBalanceData(mockData);
    } catch (error) {
      console.error('Error loading mass balance data:', error);
      toast.error('Failed to load mass balance data');
    }
  };

  const handleVerifyDWTN = async (tokenId: number) => {
    try {
      await blockchainService.verifyDWTN(tokenId, true);
      toast.success('DWTN verified successfully');
      loadDeliveries(); // Refresh data
    } catch (error) {
      console.error('Error verifying DWTN:', error);
      toast.error('Failed to verify DWTN');
    }
  };

  const handleRejectDWTN = async (tokenId: number) => {
    try {
      await blockchainService.verifyDWTN(tokenId, false);
      toast.success('DWTN rejected');
      loadDeliveries(); // Refresh data
    } catch (error) {
      console.error('Error rejecting DWTN:', error);
      toast.error('Failed to reject DWTN');
    }
  };

  const generateNewApiKey = async () => {
    try {
      setIsGeneratingKey(true);
      // Mock API key generation
      const newKey = `pk_live_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newKey);
      toast.success('New API key generated');
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Failed to generate API key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const updateWebhookUrl = async () => {
    try {
      // In production, update in Supabase
      toast.success('Webhook URL updated successfully');
    } catch (error) {
      console.error('Error updating webhook URL:', error);
      toast.error('Failed to update webhook URL');
    }
  };

  const testWebhook = async () => {
    try {
      // Mock webhook test
      toast.success('Webhook test successful');
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Webhook test failed');
    }
  };

  const getStatusColor = (status: DWTNStatus) => {
    const colors = {
      [DWTNStatus.MINTED]: 'bg-blue-100 text-blue-800',
      [DWTNStatus.IN_TRANSIT]: 'bg-yellow-100 text-yellow-800',
      [DWTNStatus.DELIVERED]: 'bg-orange-100 text-orange-800',
      [DWTNStatus.VERIFIED]: 'bg-green-100 text-green-800',
      [DWTNStatus.COMPLETED]: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB');
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Processor Integration Hub</h1>
              <p className="text-gray-600">Manage your biodiesel plant operations and API connections</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                processorData?.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {processorData?.isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'deliveries', name: 'Deliveries' },
              { id: 'mass-balance', name: 'Mass Balance' },
              { id: 'api', name: 'API Settings' },
              { id: 'settings', name: 'Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Processor Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500">Name</div>
                  <div className="text-lg text-gray-900">{processorData?.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">License</div>
                  <div className="text-lg text-gray-900">{processorData?.license}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Address</div>
                  <div className="text-lg text-gray-900">{processorData?.address}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Capacity</div>
                  <div className="text-lg text-gray-900">{processorData?.capacity}L</div>
                </div>
              </div>
            </div>

            {/* Capacity Usage */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                    <span>Current Volume</span>
                    <span>{processorData?.currentVolume}L / {processorData?.capacity}L</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${((processorData?.currentVolume || 0) / (processorData?.capacity || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {((processorData?.currentVolume || 0) / (processorData?.capacity || 1)) * 100}% capacity used
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {deliveries.slice(0, 5).map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{delivery.batchId}</div>
                      <div className="text-sm text-gray-600">
                        {delivery.volume}L from {delivery.supplier}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">DWTN Deliveries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {delivery.batchId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.volume}L
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.supplier}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(delivery.deliveryTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(delivery.status)}`}>
                            {delivery.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {delivery.status === DWTNStatus.DELIVERED && (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleVerifyDWTN(delivery.tokenId)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Verify
                              </Button>
                              <Button
                                onClick={() => handleRejectDWTN(delivery.tokenId)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mass-balance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mass Balance Data</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Input (L)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Output (L)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waste (L)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Efficiency (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {massBalanceData.map((data, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.input}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.output}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.waste}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {data.efficiency}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1"
                      readOnly
                    />
                    <Button
                      onClick={generateNewApiKey}
                      disabled={isGeneratingKey}
                      variant="outline"
                    >
                      {isGeneratingKey ? 'Generating...' : 'Generate New'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Use this API key to authenticate your requests to our API
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://your-domain.com/webhook"
                      className="flex-1"
                    />
                    <Button
                      onClick={updateWebhookUrl}
                      variant="outline"
                    >
                      Update
                    </Button>
                    <Button
                      onClick={testWebhook}
                      variant="outline"
                    >
                      Test
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll send real-time updates to this URL
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Base URL</h4>
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    https://api.genesisreloop.com/v1
                  </code>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Authentication</h4>
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    Authorization: Bearer {apiKey}
                  </code>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Endpoints</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• GET /deliveries - Get all deliveries</li>
                    <li>• POST /deliveries/{id}/verify - Verify a delivery</li>
                    <li>• GET /mass-balance - Get mass balance data</li>
                    <li>• POST /mass-balance - Submit mass balance data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processor Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Processor Name
                  </label>
                  <Input
                    value={processorData?.name || ''}
                    onChange={(e) => setProcessorData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number
                  </label>
                  <Input
                    value={processorData?.license || ''}
                    onChange={(e) => setProcessorData(prev => prev ? { ...prev, license: e.target.value } : null)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Capacity (Liters)
                  </label>
                  <Input
                    type="number"
                    value={processorData?.capacity || 0}
                    onChange={(e) => setProcessorData(prev => prev ? { ...prev, capacity: parseInt(e.target.value) } : null)}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
