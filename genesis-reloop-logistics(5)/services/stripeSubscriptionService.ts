import { supabase } from './supabase';
import { ServiceType, SubscriptionStatus } from '../types';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Mock Stripe for now - in production, use actual Stripe SDK
interface StripeSubscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  customer: string;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
      };
    }>;
  };
}

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
}

interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
}

class StripeSubscriptionService {
  private prices: Map<ServiceType, string> = new Map([
    [ServiceType.ISCC_COMPLIANCE, 'price_iscc_compliance'],
    [ServiceType.MASS_BALANCE, 'price_mass_balance'],
    [ServiceType.FRAUD_PREVENTION, 'price_fraud_prevention'],
    [ServiceType.AUTOMATED_DOCS, 'price_automated_docs']
  ]);

  private servicePrices: Map<ServiceType, number> = new Map([
    [ServiceType.ISCC_COMPLIANCE, 150],
    [ServiceType.MASS_BALANCE, 100],
    [ServiceType.FRAUD_PREVENTION, 200],
    [ServiceType.AUTOMATED_DOCS, 300]
  ]);

  /**
   * Create a Stripe customer
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // In production, use actual Stripe API
      const customerId = `cus_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // Store customer ID in Supabase
      const { error } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (error) throw error;

      return customerId;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    userId: string,
    serviceType: ServiceType,
    paymentMethodId?: string
  ): Promise<{ subscriptionId: string; clientSecret: string }> {
    try {
      // Get or create customer
      const customerId = await this.getOrCreateCustomer(userId);

      // Create subscription
      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 8)}`;

      // Store subscription in Supabase
      const { error } = await supabase
        .from('service_subscriptions')
        .insert({
          user_id: userId,
          service_type: serviceType,
          status: SubscriptionStatus.ACTIVE,
          stripe_subscription_id: subscriptionId,
          price_monthly: this.servicePrices.get(serviceType) || 0,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      return { subscriptionId, clientSecret };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      // Update subscription status in Supabase
      const { error } = await supabase
        .from('service_subscriptions')
        .update({ 
          status: SubscriptionStatus.CANCELLED,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('service_subscriptions')
        .update({ 
          status: SubscriptionStatus.PAUSED,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw new Error('Failed to pause subscription');
    }
  }

  /**
   * Resume a subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('service_subscriptions')
        .update({ 
          status: SubscriptionStatus.ACTIVE,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      throw new Error('Failed to resume subscription');
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('service_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw new Error('Failed to fetch subscriptions');
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('service_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw new Error('Failed to fetch subscription');
    }
  }

  /**
   * Update subscription status from webhook
   */
  async updateSubscriptionFromWebhook(
    subscriptionId: string,
    status: string,
    currentPeriodStart?: number,
    currentPeriodEnd?: number
  ): Promise<void> {
    try {
      const updateData: any = {
        status: this.mapStripeStatus(status),
        updated_at: new Date().toISOString()
      };

      if (currentPeriodStart) {
        updateData.current_period_start = new Date(currentPeriodStart * 1000).toISOString();
      }

      if (currentPeriodEnd) {
        updateData.current_period_end = new Date(currentPeriodEnd * 1000).toISOString();
      }

      const { error } = await supabase
        .from('service_subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscriptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating subscription from webhook:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Create payment intent for one-time payment
   */
  async createPaymentIntent(
    userId: string,
    amount: number,
    currency: string = 'gbp',
    metadata?: Record<string, any>
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 8)}`;

      // Store payment intent in Supabase
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount: amount / 100, // Convert from pence to pounds
          currency: currency.toUpperCase(),
          type: 'PAYMENT',
          status: 'PENDING',
          stripe_payment_intent_id: paymentIntentId,
          description: 'Service subscription payment'
        });

      if (error) throw error;

      return { clientSecret, paymentIntentId };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(paymentIntentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'COMPLETED',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw new Error('Failed to handle payment');
    }
  }

  /**
   * Get or create customer
   */
  private async getOrCreateCustomer(userId: string): Promise<string> {
    try {
      // Check if customer already exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('stripe_customer_id, email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (user?.stripe_customer_id) {
        return user.stripe_customer_id;
      }

      // Create new customer
      const customerId = await this.createCustomer(
        userId,
        user.email,
        `${user.first_name} ${user.last_name}`
      );

      return customerId;
    } catch (error) {
      console.error('Error getting or creating customer:', error);
      throw new Error('Failed to get or create customer');
    }
  }

  /**
   * Map Stripe status to our subscription status
   */
  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': SubscriptionStatus.ACTIVE,
      'canceled': SubscriptionStatus.CANCELLED,
      'incomplete': SubscriptionStatus.PAUSED,
      'incomplete_expired': SubscriptionStatus.EXPIRED,
      'past_due': SubscriptionStatus.PAUSED,
      'paused': SubscriptionStatus.PAUSED,
      'trialing': SubscriptionStatus.ACTIVE,
      'unpaid': SubscriptionStatus.PAUSED
    };

    return statusMap[stripeStatus] || SubscriptionStatus.PAUSED;
  }

  /**
   * Get service pricing
   */
  getServicePrice(serviceType: ServiceType): number {
    return this.servicePrices.get(serviceType) || 0;
  }

  /**
   * Get all service prices
   */
  getAllServicePrices(): Map<ServiceType, number> {
    return new Map(this.servicePrices);
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // In production, implement actual Stripe webhook signature validation
    return true;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(eventType: string, data: any): Promise<void> {
    try {
      switch (eventType) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.updateSubscriptionFromWebhook(
            data.id,
            data.status,
            data.current_period_start,
            data.current_period_end
          );
          break;

        case 'customer.subscription.deleted':
          await this.cancelSubscription(data.id);
          break;

        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(data.id);
          break;

        case 'invoice.payment_failed':
          // Handle failed payment
          console.log('Payment failed for subscription:', data.subscription);
          break;

        default:
          console.log('Unhandled webhook event:', eventType);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stripeSubscriptionService = new StripeSubscriptionService();
export default stripeSubscriptionService;
