import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { blockchainService } from '../../services/blockchainService';
import { jobService } from '../../services/jobService';
import { DWTNStatus } from '../../types';
import { toast } from 'react-hot-toast';

interface DWTNMintingInterfaceProps {
  jobId: string;
  onDWTNMinted: (tokenId: number, batchId: string) => void;
  onClose: () => void;
}

interface MintingFormData {
  batchId: string;
  volume: number;
  collectionGPS: string;
  restaurantDetails: string;
  metadataURI: string;
}

export const DWTNMintingInterface: React.FC<DWTNMintingInterfaceProps> = ({
  jobId,
  onDWTNMinted,
  onClose
}) => {
  const [formData, setFormData] = useState<MintingFormData>({
    batchId: '',
    volume: 0,
    collectionGPS: '',
    restaurantDetails: '',
    metadataURI: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    loadJobDetails();
    checkWalletConnection();
    getCurrentLocation();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const jobData = await jobService.getJobById(jobId);
      setJob(jobData);
      setFormData(prev => ({
        ...prev,
        volume: jobData.volumeLiters,
        restaurantDetails: JSON.stringify({
          name: jobData.supplier?.businessName || 'Restaurant',
          address: jobData.collectionAddress,
          contact: jobData.supplier?.contactPerson || 'N/A'
        })
      }));
    } catch (error) {
      console.error('Error loading job details:', error);
      toast.error('Failed to load job details');
    }
  };

  const checkWalletConnection = async () => {
    const connected = blockchainService.isWalletConnected();
    setWalletConnected(connected);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setFormData(prev => ({
            ...prev,
            collectionGPS: `${latitude}, ${longitude}`
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get current location');
        }
      );
    }
  };

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const account = await blockchainService.connectWallet();
      setWalletConnected(true);
      toast.success(`Wallet connected: ${account.slice(0, 6)}...${account.slice(-4)}`);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBatchId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DWTN-${timestamp}-${random}`;
  };

  const generateMetadataURI = (batchId: string) => {
    // In production, this would upload to IPFS
    return `https://genesisreloop.com/metadata/${batchId}`;
  };

  const handleInputChange = (field: keyof MintingFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMintDWTN = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.batchId || !formData.volume || !formData.collectionGPS) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      // Generate batch ID if not provided
      const batchId = formData.batchId || generateBatchId();
      
      // Generate metadata URI
      const metadataURI = formData.metadataURI || generateMetadataURI(batchId);

      // Get current account
      const currentAccount = await blockchainService.getCurrentAccount();
      if (!currentAccount) {
        throw new Error('No account connected');
      }

      // Mint DWTN
      const result = await blockchainService.mintDWTN({
        to: currentAccount,
        batchId,
        origin: job.supplierId,
        volume: formData.volume,
        collectionGPS: formData.collectionGPS,
        restaurantDetails: formData.restaurantDetails,
        metadataURI
      });

      // Update job status to IN_PROGRESS
      await jobService.updateJobStatus(jobId, 'IN_PROGRESS');

      // Create DWTN record in Supabase
      const dwtnRecord = {
        tokenId: result.tokenId,
        batchId,
        jobId,
        originId: job.supplierId,
        collectorId: currentAccount,
        volumeLiters: formData.volume,
        collectionTime: new Date().toISOString(),
        collectionGps: currentLocation,
        restaurantDetails: JSON.parse(formData.restaurantDetails),
        status: DWTNStatus.MINTED,
        metadataUri: metadataURI,
        blockchainTxHash: result.txHash,
        qrCode: blockchainService.generateQRCodeData(batchId)
      };

      // Save to Supabase (this would be implemented in a DWTN service)
      console.log('DWTN Record to save:', dwtnRecord);

      toast.success(`DWTN minted successfully! Token ID: ${result.tokenId}`);
      onDWTNMinted(result.tokenId, batchId);
      onClose();
    } catch (error) {
      console.error('Error minting DWTN:', error);
      toast.error('Failed to mint DWTN');
    } finally {
      setIsLoading(false);
    }
  };

  if (!job) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Mint Digital Waste Transfer Note</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Job Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Job Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Volume:</span>
                  <span className="ml-2 font-medium">{job.volumeLiters} liters</span>
                </div>
                <div>
                  <span className="text-gray-600">Collection Address:</span>
                  <span className="ml-2 font-medium">{job.collectionAddress}</span>
                </div>
                <div>
                  <span className="text-gray-600">Price per Liter:</span>
                  <span className="ml-2 font-medium">£{job.pricePerLiter}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <span className="ml-2 font-medium">£{job.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Wallet Connection */}
            {!walletConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-800">Wallet not connected</span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  Connect your wallet to mint the DWTN NFT
                </p>
                <Button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="mt-3"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>
            )}

            {/* DWTN Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch ID *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.batchId}
                    onChange={(e) => handleInputChange('batchId', e.target.value)}
                    placeholder="Enter batch ID or leave empty for auto-generation"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleInputChange('batchId', generateBatchId())}
                    variant="outline"
                    size="sm"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Volume (Liters) *
                </label>
                <Input
                  type="number"
                  value={formData.volume}
                  onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || 0)}
                  placeholder="Enter volume in liters"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection GPS Coordinates *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.collectionGPS}
                    onChange={(e) => handleInputChange('collectionGPS', e.target.value)}
                    placeholder="lat, lng"
                    className="flex-1"
                  />
                  <Button
                    onClick={getCurrentLocation}
                    variant="outline"
                    size="sm"
                  >
                    Use Current Location
                  </Button>
                </div>
                {currentLocation && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Details
                </label>
                <textarea
                  value={formData.restaurantDetails}
                  onChange={(e) => handleInputChange('restaurantDetails', e.target.value)}
                  placeholder="Restaurant information (JSON format)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata URI
                </label>
                <Input
                  value={formData.metadataURI}
                  onChange={(e) => handleInputChange('metadataURI', e.target.value)}
                  placeholder="IPFS metadata URI (auto-generated if empty)"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={onClose}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMintDWTN}
                disabled={!walletConnected || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Minting DWTN...' : 'Mint DWTN'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
