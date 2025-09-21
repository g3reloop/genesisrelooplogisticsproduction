import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { ServiceType, SubscriptionStatus } from '../types';
import { StripeCheckout } from '../components/checkout/StripeCheckout';
import { toast } from 'react-hot-toast';

interface Service {
  id: string;
  type: ServiceType;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
  targetAudience: string[];
  icon: string;
  popular?: boolean;
}

const services: Service[] = [
  {
    id: '1',
    type: ServiceType.ISCC_COMPLIANCE,
    name: 'ISCC Compliance Verification',
    description: 'Automated ISCC compliance verification for your UCO collection and processing operations',
    price: 150,
    priceId: 'price_1S9msn2YOzyNMCQi8IZd62nE',
    features: [
      'Automated compliance checking',
      'Real-time verification reports',
      'ISCC certificate generation',
      'Audit trail maintenance',
      'Regulatory updates notifications'
    ],
    targetAudience: ['Restaurants', 'Logistics Operators', 'Biodiesel Plants'],
    icon: '📋',
    popular: true
  },
  {
    id: '2',
    type: ServiceType.MASS_BALANCE,
    name: 'Mass Balance Monitoring',
    description: 'Track and monitor mass balance for UCO processing with real-time analytics',
    price: 100,
    priceId: 'price_1S9msv2YOzyNMCQipi1DOf9f',
    features: [
      'Real-time mass balance tracking',
      'Efficiency analytics',
      'Waste reduction insights',
      'Automated reporting',
      'Performance benchmarking'
    ],
    targetAudience: ['Biodiesel Plants', 'Processing Facilities'],
    icon: '⚖️'
  },
  {
    id: '3',
    type: ServiceType.FRAUD_PREVENTION,
    name: 'Fraud Prevention System',
    description: 'AI-powered fraud detection and prevention for UCO transactions',
    price: 200,
    priceId: 'price_1S9mt42YOzyNMCQiLb0LGwfC',
    features: [
      'AI-powered fraud detection',
      'Real-time transaction monitoring',
      'Anomaly detection alerts',
      'Risk assessment reports',
      'Automated fraud prevention'
    ],
    targetAudience: ['All Users'],
    icon: '🛡️',
    popular: true
  },
  {
    id: '4',
    type: ServiceType.AUTOMATED_DOCS,
    name: 'Automated Documentation',
    description: 'Generate compliance documents and reports automatically',
    price: 300,
    priceId: 'price_1S9mtD2YOzyNMCQiHFr2dEOL',
    features: [
      'Automated document generation',
      'Custom report templates',
      'Compliance documentation',
      'Audit trail generation',
      'Document version control'
    ],
    targetAudience: ['Restaurants', 'Logistics Operators', 'Biodiesel Plants'],
    icon: '📄'
  }
];

const ServiceMarketplacePage: React.FC = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<Record<string, SubscriptionStatus>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutService, setCheckoutService] = useState<Service | null>(null);

  useEffect(() => {
    loadUserSubscriptions();
  }, []);

  const loadUserSubscriptions = async () => {
    // In a real implementation, this would fetch from Supabase
    // For now, we'll simulate with empty data
    setUserSubscriptions({});
  };

  const handleSubscribe = async (service: Service) => {
    setCheckoutService(service);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (subscriptionId: string) => {
    if (checkoutService) {
      setUserSubscriptions(prev => ({
        ...prev,
        [checkoutService.type]: SubscriptionStatus.ACTIVE
      }));
      toast.success(`Successfully subscribed to ${checkoutService.name}!`);
    }
    setShowCheckout(false);
    setCheckoutService(null);
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setCheckoutService(null);
  };

  const handleUnsubscribe = async (service: Service) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would cancel the Stripe subscription
      console.log('Unsubscribing from service:', service);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUserSubscriptions(prev => ({
        ...prev,
        [service.type]: SubscriptionStatus.CANCELLED
      }));
      
      toast.success(`Successfully unsubscribed from ${service.name}`);
    } catch (error) {
      console.error('Error unsubscribing from service:', error);
      toast.error('Failed to unsubscribe from service');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionStatus = (serviceType: ServiceType): SubscriptionStatus | null => {
    return userSubscriptions[serviceType] || null;
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    const colors = {
      [SubscriptionStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [SubscriptionStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [SubscriptionStatus.PAUSED]: 'bg-yellow-100 text-yellow-800',
      [SubscriptionStatus.EXPIRED]: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Service Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enhance your UCO collection and processing operations with our comprehensive suite of services
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {services.map((service) => {
            const subscriptionStatus = getSubscriptionStatus(service.type);
            const isSubscribed = subscriptionStatus === SubscriptionStatus.ACTIVE;
            
            return (
              <div
                key={service.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  service.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {service.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{service.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {service.name}
                      </h3>
                      <p className="text-gray-600">£{service.price}/month</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {service.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                    <ul className="space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Target Audience:</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.targetAudience.map((audience, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>

                  {subscriptionStatus && (
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscriptionStatus)}`}>
                        {subscriptionStatus.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {isSubscribed ? (
                      <Button
                        onClick={() => handleUnsubscribe(service)}
                        disabled={isLoading}
                        variant="outline"
                        className="flex-1"
                      >
                        {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(service)}
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Subscribing...' : `Subscribe - £${service.price}/month`}
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => setSelectedService(service)}
                      variant="outline"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Details Modal */}
        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <span className="text-4xl mr-4">{selectedService.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedService.name}
                      </h2>
                      <p className="text-xl text-gray-600">£{selectedService.price}/month</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedService.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Features</h3>
                    <ul className="space-y-2">
                      {selectedService.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Target Audience</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedService.targetAudience.map((audience, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {audience}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        £{selectedService.price}
                      </span>
                      <span className="text-gray-600">per month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Billed monthly • Cancel anytime
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                  <Button
                    onClick={() => setSelectedService(null)}
                    variant="outline"
                  >
                    Close
                  </Button>
                  {getSubscriptionStatus(selectedService.type) === SubscriptionStatus.ACTIVE ? (
                    <Button
                      onClick={() => handleUnsubscribe(selectedService)}
                      disabled={isLoading}
                      variant="outline"
                    >
                      {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(selectedService)}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? 'Subscribing...' : 'Subscribe Now'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="bg-blue-600 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of businesses already using our services to streamline their UCO operations and ensure compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Browse Services
            </Button>
            <Button
              onClick={() => {/* Navigate to contact */}}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Stripe Checkout */}
      {showCheckout && checkoutService && (
        <StripeCheckout
          serviceType={checkoutService.type}
          priceId={checkoutService.priceId}
          onSuccess={handleCheckoutSuccess}
          onCancel={handleCheckoutCancel}
        />
      )}
    </div>
  );
};
export default ServiceMarketplacePage;
