import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'SUPPLIER' | 'DRIVER' | 'BUYER' | 'ADMIN';
          onboarding_complete: boolean;
          email_verified: boolean;
          phone?: string;
          address?: string;
          city?: string;
          postcode?: string;
          country: string;
          wallet_address?: string;
          created_at: string;
          updated_at: string;
          last_login?: string;
          is_active: boolean;
          verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
          profile_image_url?: string;
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          name: string;
          role: 'SUPPLIER' | 'DRIVER' | 'BUYER' | 'ADMIN';
          onboarding_complete?: boolean;
          email_verified?: boolean;
          phone?: string;
          address?: string;
          city?: string;
          postcode?: string;
          country?: string;
          wallet_address?: string;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
          is_active?: boolean;
          verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
          profile_image_url?: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          name?: string;
          role?: 'SUPPLIER' | 'DRIVER' | 'BUYER' | 'ADMIN';
          onboarding_complete?: boolean;
          email_verified?: boolean;
          phone?: string;
          address?: string;
          city?: string;
          postcode?: string;
          country?: string;
          wallet_address?: string;
          created_at?: string;
          updated_at?: string;
          last_login?: string;
          is_active?: boolean;
          verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
          profile_image_url?: string;
          metadata?: Record<string, any>;
        };
      };
      jobs: {
        Row: {
          id: string;
          supplier_id: string;
          driver_id?: string;
          buyer_id?: string;
          title: string;
          description?: string;
          volume_litres: number;
          confirmed_volume_litres?: number;
          contamination: 'NONE' | 'LOW' | 'HIGH';
          oil_state: 'LIQUID' | 'SOLID' | 'MIXED';
          status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          priority: number;
          estimated_pickup_time?: string;
          actual_pickup_time?: string;
          estimated_delivery_time?: string;
          actual_delivery_time?: string;
          pickup_address: string;
          delivery_address: string;
          pickup_coordinates?: any;
          delivery_coordinates?: any;
          distance_km?: number;
          estimated_duration_minutes?: number;
          genesis_points_reward: number;
          payment_amount?: number;
          payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
          special_instructions?: string;
          created_at: string;
          updated_at: string;
          completed_at?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          driver_id?: string;
          buyer_id?: string;
          title: string;
          description?: string;
          volume_litres: number;
          confirmed_volume_litres?: number;
          contamination: 'NONE' | 'LOW' | 'HIGH';
          oil_state: 'LIQUID' | 'SOLID' | 'MIXED';
          status?: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          priority?: number;
          estimated_pickup_time?: string;
          actual_pickup_time?: string;
          estimated_delivery_time?: string;
          actual_delivery_time?: string;
          pickup_address: string;
          delivery_address: string;
          pickup_coordinates?: any;
          delivery_coordinates?: any;
          distance_km?: number;
          estimated_duration_minutes?: number;
          genesis_points_reward?: number;
          payment_amount?: number;
          payment_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
          special_instructions?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          driver_id?: string;
          buyer_id?: string;
          title?: string;
          description?: string;
          volume_litres?: number;
          confirmed_volume_litres?: number;
          contamination?: 'NONE' | 'LOW' | 'HIGH';
          oil_state?: 'LIQUID' | 'SOLID' | 'MIXED';
          status?: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
          priority?: number;
          estimated_pickup_time?: string;
          actual_pickup_time?: string;
          estimated_delivery_time?: string;
          actual_delivery_time?: string;
          pickup_address?: string;
          delivery_address?: string;
          pickup_coordinates?: any;
          delivery_coordinates?: any;
          distance_km?: number;
          estimated_duration_minutes?: number;
          genesis_points_reward?: number;
          payment_amount?: number;
          payment_status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
          special_instructions?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string;
          cancelled_at?: string;
          cancellation_reason?: string;
        };
      };
    };
  };
};
