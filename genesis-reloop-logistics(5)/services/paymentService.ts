import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { Transaction, PaymentStatus } from '../types';

class PaymentService {
  private stripe: Stripe | null = null;
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }

  // Initialize Stripe
  async initializeStripe(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await this.stripePromise;
    }
    return this.stripe;
  }

  // Create payment intent for container purchase
  async createContainerPurchaseIntent(
    userId: string,
    containerCount: number,
    amount: number
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          userId,
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'gbp',
          metadata: {
            type: 'container_purchase',
            containerCount: containerCount.toString(),
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      };
    } catch (error: any) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Create payment intent for job payment
  async createJobPaymentIntent(
    jobId: string,
    amount: number,
    currency: string = 'gbp'
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          jobId,
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            type: 'job_payment',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
      };
    } catch (error: any) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Confirm payment
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await this.initializeStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await stripe.confirmPayment({
        clientSecret: paymentIntentId,
        confirmParams: {
          payment_method: paymentMethodId,
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Process payment with saved payment method
  async processPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          paymentIntentId,
          paymentMethodId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: data.success, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get payment methods for user
  async getPaymentMethods(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { userId },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.paymentMethods || [];
    } catch (error: any) {
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }
  }

  // Create payment method
  async createPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-method', {
        body: {
          userId,
          paymentMethodId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: data.success, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete payment method
  async deletePaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('delete-payment-method', {
        body: {
          userId,
          paymentMethodId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: data.success, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get transaction history
  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Transaction[]; total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data || [],
        total: count || 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  // Create transaction record
  async createTransaction(
    userId: string,
    jobId: string | null,
    amount: number,
    currency: string,
    transactionType: string,
    description?: string,
    metadata: Record<string, any> = {}
  ): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          job_id: jobId,
          amount,
          currency,
          transaction_type: transactionType,
          description,
          metadata,
          status: PaymentStatus.PENDING,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string,
    status: PaymentStatus,
    stripePaymentIntentId?: string
  ): Promise<Transaction> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (stripePaymentIntentId) {
        updateData.stripe_payment_intent_id = stripePaymentIntentId;
      }

      if (status === PaymentStatus.COMPLETED) {
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }
  }

  // Process refund
  async processRefund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          transactionId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: data.success, error: data.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get payment statistics
  async getPaymentStatistics(userId: string): Promise<{
    totalEarnings: number;
    totalSpent: number;
    monthlyEarnings: number;
    monthlySpent: number;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-statistics', {
        body: { userId },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      throw new Error(`Failed to get payment statistics: ${error.message}`);
    }
  }

  // Setup payment form
  async setupPaymentForm(
    containerId: string,
    clientSecret: string
  ): Promise<{ error?: string }> {
    try {
      const stripe = await this.initializeStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'dark',
          variables: {
            colorPrimary: '#00F0B5',
            colorBackground: '#0A0F0D',
            colorText: '#E5E7EB',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px',
          },
        },
      });

      const paymentElement = elements.create('payment');
      await paymentElement.mount(containerId);

      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Validate payment form
  async validatePaymentForm(): Promise<{ error?: string }> {
    try {
      const stripe = await this.initializeStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      // This would typically validate the payment form
      // Implementation depends on specific validation requirements
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  }

  // Get Stripe customer ID
  async getStripeCustomerId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data.metadata?.stripe_customer_id || null;
    } catch (error: any) {
      console.error('Error getting Stripe customer ID:', error);
      return null;
    }
  }

  // Create Stripe customer
  async createStripeCustomer(
    userId: string,
    email: string,
    name: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-customer', {
        body: {
          userId,
          email,
          name,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.customerId;
    } catch (error: any) {
      console.error('Error creating Stripe customer:', error);
      return null;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
