import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import AIJobMatching from '../components/ai/AIJobMatching';
import AIRouteOptimization from '../components/ai/AIRouteOptimization';

const HomePage: React.FC = () => {
  const [showAIFeatures, setShowAIFeatures] = useState(false);

  // Mock data for demonstration
  const mockJob = {
    id: 'job_1',
    title: 'UCO Collection - The Golden Spoon',
    volume: 50,
    pickupAddress: '123 Culinary Lane, London',
    deliveryAddress: '789 Industrial Park, London',
    contamination: 'LOW',
    priority: 1
  };

  const mockDrivers = [
    { id: 'driver_1', name: 'John Smith', vehicleCapacity: 100, rating: 4.8, address: 'London', completedJobs: 45 },
    { id: 'driver_2', name: 'Sarah Johnson', vehicleCapacity: 80, rating: 4.6, address: 'London', completedJobs: 32 },
    { id: 'driver_3', name: 'Mike Wilson', vehicleCapacity: 120, rating: 4.9, address: 'London', completedJobs: 67 }
  ];

  const mockRoute = {
    waypoints: [
      { lat: 51.5074, lng: -0.1278, address: 'Start Location' },
      { lat: 51.5154, lng: -0.1280, address: 'The Golden Spoon' },
      { lat: 51.5000, lng: -0.1200, address: 'BioFuel Depot' }
    ],
    totalDistance: 15.2,
    totalDuration: 45
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Genesis Reloop Logistics
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transforming waste into value through blockchain-verified, AI-optimized logistics
          </p>
          <div className="space-x-4">
            <Button 
              size="lg"
              onClick={() => setShowAIFeatures(!showAIFeatures)}
            >
              {showAIFeatures ? 'Hide AI Features' : 'Explore AI Features'}
            </Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* AI Features Demo */}
      {showAIFeatures && (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Features
            </h2>
            <p className="text-lg text-gray-600">
              Experience our cutting-edge AI technology in action
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Job Matching */}
            <div>
              <AIJobMatching 
                job={mockJob}
                drivers={mockDrivers}
                onMatchSelect={(match) => {
                  console.log('Selected match:', match);
                }}
              />
            </div>

            {/* AI Route Optimization */}
            <div>
              <AIRouteOptimization 
                originalRoute={mockRoute}
                onRouteUpdate={(optimized) => {
                  console.log('Route optimized:', optimized);
                }}
              />
            </div>
          </div>

          {/* Additional AI Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mass Balance Monitoring</h3>
              <p className="text-gray-600">AI-powered insights for waste-to-energy efficiency tracking</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fraud Prevention</h3>
              <p className="text-gray-600">Advanced AI detection for suspicious activities and anomalies</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Automated Documentation</h3>
              <p className="text-gray-600">AI-generated compliance reports and regulatory documentation</p>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Genesis Reloop?
            </h2>
            <p className="text-lg text-gray-600">
              Cutting-edge technology meets environmental responsibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600">Intelligent job matching and route optimization</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Verified</h3>
              <p className="text-gray-600">Immutable chain of custody tracking</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sustainable</h3>
              <p className="text-gray-600">Transforming waste into renewable energy</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profitable</h3>
              <p className="text-gray-600">Earn Genesis Points and profit sharing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;