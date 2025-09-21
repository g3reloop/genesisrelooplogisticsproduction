import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../common/Button';
import { ServiceType } from '../../types';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
  serviceType: ServiceType;
  priceId: string;
  onSuccess: (subscriptionId: string) => void;
  onCancel: () => void;
}

// Product configuration
const PRODUCTS = {
  [ServiceType.ISCC_COMPLIANCE]: {
    name: 'ISCC Compliance Verification',
    price: 150,
    priceId: 'price_1S9msn2YOzyNMCQi8IZd62nE',
    description: 'Automated ISCC compliance verification for your UCO collection and processing operations',
    features: [
      'Real-time compliance checking',
      'Certificate generation',
      'Audit trail maintenance',
      'Regulatory updates'
    ]
  },
  [ServiceType.MASS_BALANCE]: {
    name: 'Mass Balance Monitoring',
    price: 100,
    priceId: 'price_1S9msv2YOzyNMCQipi1DOf9f',
    description: 'Track and monitor mass balance for UCO processing with real-time analytics',
    features: [
      'Real-time mass balance tracking',
      'Efficiency analytics',
      'Waste reduction insights',
      'Automated reporting'
    ]
  },
  [ServiceType.FRAUD_PREVENTION]: {
    name: 'Fraud Prevention System',
    price: 200,
    priceId: 'price_1S9mt42YOzyNMCQiLb0LGwfC',
    description: 'AI-powered fraud detection and prevention for UCO transactions',
    features: [
      'AI-powered fraud detection',
      'Real-time monitoring',
      'Anomaly detection alerts',
      'Risk assessment reports'
    ]
  },
  [ServiceType.AUTOMATED_DOCS]: {
    name: 'Automated Documentation',
    price: 300,
    priceId: 'price_1S9mtD2YOzyNMCQiHFr2dEOL',
    description: 'Generate compliance documents and reports automatically',
    features: [
      'Automated document generation',
      'Custom report templates',
      'Compliance documentation',
      'Document version control'
    ]
  }
};

const CheckoutForm: React.FC<{ serviceType: ServiceType; onSuccess: (subscriptionId: string) => void; onCancel: () => void }> = ({
  serviceType,
  onSuccess,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  const product = PRODUCTS[serviceType];

  useEffect(() => {
    // Create payment intent
    createPaymentIntent();
  }, [serviceType]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: product.priceId,
          serviceType: serviceType
        }),
      });

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Failed to initialize payment');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?subscription=success`,
      },
    });

    if (error) {
      console.error('Payment failed:', error);
      toast.error(error.message || 'Payment failed');
    } else if (paymentIntent.status === 'succeeded') {
      toast.success('Subscription activated successfully!');
      onSuccess(paymentIntent.id);
    }

    setIsLoading(false);
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Service Details */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">£{product.price}</div>
            <div className="text-sm text-gray-600">per month</div>
          </div>
        </div>
        <p className="text-gray-700 mb-4">{product.description}</p>
        <div className="grid grid-cols-2 gap-2">
          {product.features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Element */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h4>
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: '',
                email: '',
              }
            }
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          {isLoading ? 'Processing...' : `Subscribe for £${product.price}/month`}
        </Button>
      </div>
    </form>
  );
};

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  serviceType,
  priceId,
  onSuccess,
  onCancel
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white text-xl font-bold">GR</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Genesis Reloop Logistics</h2>
                <p className="text-gray-600">Complete your subscription</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Checkout Form */}
          <Elements 
            stripe={stripePromise}
            options={{
              clientSecret: '',
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#2563eb',
                  colorBackground: '#ffffff',
                  colorText: '#1f2937',
                  colorDanger: '#dc2626',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '8px',
                },
                rules: {
                  '.Input': {
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '12px',
                  },
                  '.Input:focus': {
                    border: '2px solid #2563eb',
                    boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                  },
                  '.Label': {
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  },
                  '.Tab': {
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  },
                  '.Tab--selected': {
                    border: '2px solid #2563eb',
                    backgroundColor: '#eff6ff',
                  },
                },
              },
            }}
          >
            <CheckoutForm 
              serviceType={serviceType}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </Elements>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Your payment information is secure and encrypted. Powered by Stripe.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
