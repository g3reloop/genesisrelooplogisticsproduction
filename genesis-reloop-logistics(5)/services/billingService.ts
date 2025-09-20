import { supabase } from '../lib/supabase';
import { Transaction, PaymentStatus, UserRole } from '../types';
import { paymentService } from './paymentService';

interface Invoice {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: string;
  paidAt?: string;
}

interface BillingSummary {
  totalEarnings: number;
  totalFees: number;
  netEarnings: number;
  pendingPayments: number;
  nextPayout: string;
  paymentHistory: Transaction[];
}

export const billingService = {
  // Get user's billing summary
  getBillingSummary: async (userId: string, role: UserRole): Promise<BillingSummary> => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalEarnings = transactions
        ?.filter(t => t.transaction_type === 'EARNINGS' && t.status === PaymentStatus.COMPLETED)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalFees = transactions
        ?.filter(t => t.transaction_type === 'PLATFORM_FEE' && t.status === PaymentStatus.COMPLETED)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const pendingPayments = transactions
        ?.filter(t => t.transaction_type === 'EARNINGS' && t.status === PaymentStatus.PENDING)
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const netEarnings = totalEarnings - totalFees;

      // Calculate next payout date (weekly for drivers, monthly for others)
      const nextPayout = calculateNextPayoutDate(role);

      return {
        totalEarnings,
        totalFees,
        netEarnings,
        pendingPayments,
        nextPayout,
        paymentHistory: transactions || []
      };
    } catch (error) {
      console.error('Error getting billing summary:', error);
      throw error;
    }
  },

  // Generate invoice for platform fees
  generateInvoice: async (userId: string, period: string): Promise<Invoice> => {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Calculate platform fees for the period
      const fees = await calculatePlatformFees(userId, period);
      
      const invoice: Invoice = {
        id: `INV-${Date.now()}`,
        userId,
        amount: fees.total,
        currency: 'GBP',
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        items: fees.items,
        createdAt: new Date().toISOString()
      };

      // Store invoice in database
      await supabase
        .from('invoices')
        .insert({
          invoice_id: invoice.id,
          user_id: userId,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          due_date: invoice.dueDate,
          items: invoice.items,
          created_at: invoice.createdAt
        });

      return invoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  },

  // Process payment for invoice
  processPayment: async (invoiceId: string, paymentMethod: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('invoice_id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      if (invoice.status === 'paid') {
        return { success: false, error: 'Invoice already paid' };
      }

      // Create payment intent
      const clientSecret = await paymentService.createPaymentIntent(
        invoice.amount * 100, // Convert to pence
        invoice.currency,
        { invoiceId, userId: invoice.user_id }
      );

      // In a real implementation, you would handle the payment confirmation here
      // For now, we'll simulate a successful payment
      const transaction = await paymentService.confirmPayment(clientSecret, paymentMethod);

      // Update invoice status
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_method: paymentMethod,
          transaction_id: transaction.id
        })
        .eq('invoice_id', invoiceId);

      return {
        success: true,
        transactionId: transaction.id
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  },

  // Get user's invoices
  getInvoices: async (userId: string): Promise<Invoice[]> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(invoice => ({
        id: invoice.invoice_id,
        userId: invoice.user_id,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        dueDate: invoice.due_date,
        items: invoice.items,
        createdAt: invoice.created_at,
        paidAt: invoice.paid_at
      })) || [];
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  },

  // Process driver earnings payout
  processDriverPayout: async (driverId: string): Promise<{
    success: boolean;
    amount: number;
    transactionId?: string;
  }> => {
    try {
      // Get pending earnings
      const { data: pendingEarnings, error: earningsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', driverId)
        .eq('transaction_type', 'EARNINGS')
        .eq('status', PaymentStatus.PENDING);

      if (earningsError) throw earningsError;

      if (!pendingEarnings || pendingEarnings.length === 0) {
        return { success: false, amount: 0 };
      }

      const totalAmount = pendingEarnings.reduce((sum, earning) => sum + earning.amount, 0);

      // Create payout transaction
      const { data: payoutTransaction, error: payoutError } = await supabase
        .from('transactions')
        .insert({
          user_id: driverId,
          amount: totalAmount,
          currency: 'GBP',
          transaction_type: 'PAYOUT',
          status: PaymentStatus.COMPLETED,
          description: 'Weekly driver earnings payout',
          metadata: {
            source: 'driver_earnings',
            period: 'weekly',
            job_count: pendingEarnings.length
          },
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Update pending earnings to completed
      await supabase
        .from('transactions')
        .update({ status: PaymentStatus.COMPLETED })
        .eq('user_id', driverId)
        .eq('transaction_type', 'EARNINGS')
        .eq('status', PaymentStatus.PENDING);

      return {
        success: true,
        amount: totalAmount,
        transactionId: payoutTransaction.id
      };
    } catch (error) {
      console.error('Error processing driver payout:', error);
      throw error;
    }
  },

  // Calculate platform fees
  calculatePlatformFees: async (userId: string, period: string): Promise<{
    total: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  }> => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('supplier_id', userId)
        .eq('status', 'COMPLETED')
        .gte('completed_at', getPeriodStartDate(period))
        .lte('completed_at', getPeriodEndDate(period));

      if (error) throw error;

      const platformFeeRate = 0.05; // 5% platform fee
      const items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }> = [];

      let totalFees = 0;

      jobs?.forEach(job => {
        const jobFee = (job.payment || 0) * platformFeeRate;
        totalFees += jobFee;

        items.push({
          description: `Platform fee for job ${job.id}`,
          quantity: 1,
          unitPrice: jobFee,
          total: jobFee
        });
      });

      return {
        total: totalFees,
        items
      };
    } catch (error) {
      console.error('Error calculating platform fees:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async (userId: string): Promise<Array<{
    id: string;
    type: string;
    last4: string;
    brand: string;
    isDefault: boolean;
  }>> => {
    try {
      // In a real implementation, this would fetch from Stripe or similar
      // For now, return mock data
      return [
        {
          id: 'pm_1234567890',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          isDefault: true
        }
      ];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  },

  // Add payment method
  addPaymentMethod: async (userId: string, paymentMethodData: any): Promise<{
    success: boolean;
    paymentMethodId?: string;
    error?: string;
  }> => {
    try {
      // In a real implementation, this would create a payment method in Stripe
      const paymentMethodId = `pm_${Date.now()}`;
      
      return {
        success: true,
        paymentMethodId
      };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add payment method'
      };
    }
  },

  // Get transaction history
  getTransactionHistory: async (
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
  }> => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      return {
        transactions: transactions || [],
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }
};

// Helper functions
function calculateNextPayoutDate(role: UserRole): string {
  const now = new Date();
  
  if (role === UserRole.DRIVER) {
    // Weekly payouts for drivers (every Friday)
    const nextFriday = new Date(now);
    const daysUntilFriday = (5 - now.getDay() + 7) % 7;
    nextFriday.setDate(now.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
    nextFriday.setHours(17, 0, 0, 0); // 5 PM
    return nextFriday.toISOString();
  } else {
    // Monthly payouts for suppliers and buyers (1st of next month)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonth.setHours(9, 0, 0, 0); // 9 AM
    return nextMonth.toISOString();
  }
}

function getPeriodStartDate(period: string): string {
  const now = new Date();
  
  switch (period) {
    case 'weekly':
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo.toISOString();
    case 'monthly':
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo.toISOString();
    case 'quarterly':
      const quarterAgo = new Date(now);
      quarterAgo.setMonth(now.getMonth() - 3);
      return quarterAgo.toISOString();
    case 'yearly':
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return yearAgo.toISOString();
    default:
      return now.toISOString();
  }
}

function getPeriodEndDate(period: string): string {
  return new Date().toISOString();
}