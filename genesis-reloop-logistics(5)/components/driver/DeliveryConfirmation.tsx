import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { blockchainService } from '../../services/blockchainService';
import { DWTNStatus } from '../../types';
import { toast } from 'react-hot-toast';

interface DeliveryConfirmationProps {
  dwtnTokenId: number;
  onDeliveryConfirmed: (txHash: string) => void;
  onClose: () => void;
}

interface DeliveryFormData {
  processorAddress: string;
  deliveryGPS: string;
  processorDetails: string;
  volumeDelivered: number;
  qualityNotes: string;
}

export const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({
  dwtnTokenId,
  onDeliveryConfirmed,
  onClose
}) => {
  const [formData, setFormData] = useState<DeliveryFormData>({
    processorAddress: '',
    deliveryGPS: '',
    processorDetails: '',
    volumeDelivered: 0,
    qualityNotes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dwtnData, setDwtnData] = useState<any>(null);

  useEffect(() => {
    checkWalletConnection();
    getCurrentLocation();
    loadDWTNData();
  }, [dwtnTokenId]);

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
            deliveryGPS: `${latitude}, ${longitude}`
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get current location');
        }
      );
    }
  };

  const loadDWTNData = async () => {
    try {
      const data = await blockchainService.getDWTNData(dwtnTokenId);
      setDwtnData(data);
      setFormData(prev => ({
        ...prev,
        volumeDelivered: data.volumeLiters
      }));
    } catch (error) {
      console.error('Error loading DWTN data:', error);
      toast.error('Failed to load DWTN data');
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

  const handleInputChange = (field: keyof DeliveryFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmDelivery = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.processorAddress || !formData.deliveryGPS || !formData.processorDetails) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      // Record delivery on blockchain
      const txHash = await blockchainService.recordDelivery(
        dwtnTokenId,
        formData.processorAddress,
        formData.deliveryGPS,
        JSON.stringify({
          ...JSON.parse(formData.processorDetails),
          volumeDelivered: formData.volumeDelivered,
          qualityNotes: formData.qualityNotes,
          deliveryTime: new Date().toISOString()
        })
      );

      // Update DWTN status to DELIVERED
      await blockchainService.updateDWTNStatus(dwtnTokenId, DWTNStatus.DELIVERED);

      toast.success('Delivery confirmed successfully!');
      onDeliveryConfirmed(txHash);
      onClose();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    } finally {
      setIsLoading(false);
    }
  };

  if (!dwtnData) {
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
            <h2 className="text-2xl font-bold text-gray-900">Confirm Delivery</h2>
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
            {/* DWTN Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">DWTN Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Batch ID:</span>
                  <span className="ml-2 font-medium">{dwtnData.batchId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Token ID:</span>
                  <span className="ml-2 font-medium">{dwtnData.tokenId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Volume:</span>
                  <span className="ml-2 font-medium">{dwtnData.volumeLiters} liters</span>
                </div>
                <div>
                  <span className="text-gray-600">Collection Time:</span>
                  <span className="ml-2 font-medium">
                    {new Date(dwtnData.collectionTime).toLocaleString()}
                  </span>
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
                  Connect your wallet to confirm delivery
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

            {/* Delivery Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processor Address *
                </label>
                <Input
                  value={formData.processorAddress}
                  onChange={(e) => handleInputChange('processorAddress', e.target.value)}
                  placeholder="Enter processor wallet address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery GPS Coordinates *
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.deliveryGPS}
                    onChange={(e) => handleInputChange('deliveryGPS', e.target.value)}
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
                  Volume Delivered (Liters)
                </label>
                <Input
                  type="number"
                  value={formData.volumeDelivered}
                  onChange={(e) => handleInputChange('volumeDelivered', parseFloat(e.target.value) || 0)}
                  placeholder="Enter delivered volume"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processor Details *
                </label>
                <textarea
                  value={formData.processorDetails}
                  onChange={(e) => handleInputChange('processorDetails', e.target.value)}
                  placeholder="Enter processor information (JSON format)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: {"{"}"name": "BioFuel Plant Ltd", "license": "BF123456", "contact": "John Doe"{"}"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Notes
                </label>
                <textarea
                  value={formData.qualityNotes}
                  onChange={(e) => handleInputChange('qualityNotes', e.target.value)}
                  placeholder="Enter any quality observations or notes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
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
                onClick={handleConfirmDelivery}
                disabled={!walletConnected || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Confirming Delivery...' : 'Confirm Delivery'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
