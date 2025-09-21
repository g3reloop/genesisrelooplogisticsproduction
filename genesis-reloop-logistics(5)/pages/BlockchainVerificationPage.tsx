import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { blockchainService } from '../services/blockchainService';
import { DWTNRecord, DWTNStatus } from '../types';
import { toast } from 'react-hot-toast';

export const BlockchainVerificationPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [searchBatchId, setSearchBatchId] = useState(batchId || '');
  const [dwtnData, setDwtnData] = useState<DWTNRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      handleSearch(batchId);
    }
  }, [batchId]);

  const handleSearch = async (searchId: string) => {
    if (!searchId.trim()) {
      toast.error('Please enter a batch ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await blockchainService.getDWTNByBatch(searchId);
      setDwtnData(data);
      setSearchBatchId(searchId);
    } catch (error) {
      console.error('Error fetching DWTN data:', error);
      setError('DWTN not found or error occurred');
      setDwtnData(null);
    } finally {
      setIsLoading(false);
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

  const getStatusIcon = (status: DWTNStatus) => {
    const icons = {
      [DWTNStatus.MINTED]: '🔵',
      [DWTNStatus.IN_TRANSIT]: '🚛',
      [DWTNStatus.DELIVERED]: '📦',
      [DWTNStatus.VERIFIED]: '✅',
      [DWTNStatus.COMPLETED]: '🎉'
    };
    return icons[status] || '❓';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const generateQRCode = () => {
    if (dwtnData) {
      const qrData = blockchainService.generateQRCodeData(dwtnData.batchId);
      // In a real implementation, you would use a QR code library
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Blockchain Verification Dashboard
          </h1>
          <p className="text-gray-600">
            Verify Digital Waste Transfer Notes (DWTNs) on the blockchain
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Search DWTN by Batch ID
          </h2>
          <div className="flex gap-4">
            <Input
              value={searchBatchId}
              onChange={(e) => setSearchBatchId(e.target.value)}
              placeholder="Enter DWTN batch ID"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchBatchId)}
            />
            <Button
              onClick={() => handleSearch(searchBatchId)}
              disabled={isLoading}
              className="px-8"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* DWTN Data Display */}
        {dwtnData && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    DWTN #{dwtnData.batchId}
                  </h2>
                  <p className="text-gray-600">Token ID: {dwtnData.tokenId}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={generateQRCode}
                    variant="outline"
                    size="sm"
                  >
                    Generate QR Code
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(dwtnData.batchId)}
                    variant="outline"
                    size="sm"
                  >
                    Copy Batch ID
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dwtnData.status)}`}>
                  <span className="mr-2">{getStatusIcon(dwtnData.status)}</span>
                  {dwtnData.status.replace('_', ' ')}
                </span>
                {dwtnData.isVerified && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="mr-2">✅</span>
                    Verified
                  </span>
                )}
              </div>
            </div>

            {/* Chain of Custody Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Chain of Custody Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">Collection Initiated</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(dwtnData.collectionTime)} • {dwtnData.volumeLiters} liters
                    </p>
                    {dwtnData.collectionGps && (
                      <p className="text-xs text-gray-400">
                        Location: {dwtnData.collectionGps.lat.toFixed(6)}, {dwtnData.collectionGps.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>

                {dwtnData.status !== DWTNStatus.MINTED && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-sm font-medium">2</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">In Transit</p>
                      <p className="text-sm text-gray-500">
                        UCO being transported to processor
                      </p>
                    </div>
                  </div>
                )}

                {dwtnData.deliveryTime && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-medium">3</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(dwtnData.deliveryTime)}
                      </p>
                      {dwtnData.deliveryGps && (
                        <p className="text-xs text-gray-400">
                          Delivery Location: {dwtnData.deliveryGps.lat.toFixed(6)}, {dwtnData.deliveryGps.lng.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {dwtnData.isVerified && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-medium">4</span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">Verified by Processor</p>
                      <p className="text-sm text-gray-500">
                        UCO batch confirmed and verified
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Origin Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Restaurant</p>
                    <p className="text-sm text-gray-900">
                      {dwtnData.restaurantDetails?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">
                      {dwtnData.restaurantDetails?.address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact</p>
                    <p className="text-sm text-gray-900">
                      {dwtnData.restaurantDetails?.contact || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Collection Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Collection Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Volume</p>
                    <p className="text-sm text-gray-900">
                      {dwtnData.volumeLiters} liters
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Collection Time</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(dwtnData.collectionTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Collector</p>
                    <p className="text-sm text-gray-900 font-mono">
                      {dwtnData.collectorId.slice(0, 6)}...{dwtnData.collectorId.slice(-4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Processor Details */}
              {dwtnData.processorId && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Processor Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Processor</p>
                      <p className="text-sm text-gray-900 font-mono">
                        {dwtnData.processorId.slice(0, 6)}...{dwtnData.processorId.slice(-4)}
                      </p>
                    </div>
                    {dwtnData.deliveryTime && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Delivery Time</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(dwtnData.deliveryTime)}
                        </p>
                      </div>
                    )}
                    {dwtnData.processorDetails && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Details</p>
                        <p className="text-sm text-gray-900">
                          {JSON.stringify(dwtnData.processorDetails, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Blockchain Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Blockchain Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Token ID</p>
                    <p className="text-sm text-gray-900 font-mono">
                      {dwtnData.tokenId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Batch ID</p>
                    <p className="text-sm text-gray-900 font-mono">
                      {dwtnData.batchId}
                    </p>
                  </div>
                  {dwtnData.blockchainTxHash && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Transaction Hash</p>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {dwtnData.blockchainTxHash}
                      </p>
                    </div>
                  )}
                  {dwtnData.metadataUri && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Metadata URI</p>
                      <a
                        href={dwtnData.metadataUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {dwtnData.metadataUri}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => copyToClipboard(window.location.href)}
                  variant="outline"
                >
                  Copy Verification Link
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                >
                  Print Certificate
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching blockchain for DWTN...</p>
          </div>
        )}
      </div>
    </div>
  );
};
