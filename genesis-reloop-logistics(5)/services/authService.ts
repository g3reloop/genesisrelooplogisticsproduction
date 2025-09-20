import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

// Convert Supabase user to our User type
const mapSupabaseUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    name: supabaseUser.name,
    email: supabaseUser.email,
    role: supabaseUser.role as UserRole,
    onboardingComplete: supabaseUser.onboarding_complete,
    address: supabaseUser.address,
    walletAddress: supabaseUser.wallet_address,
    phone: supabaseUser.phone,
    city: supabaseUser.city,
    postcode: supabaseUser.postcode,
    country: supabaseUser.country,
    emailVerified: supabaseUser.email_verified,
    isActive: supabaseUser.is_active,
    verificationStatus: supabaseUser.verification_status,
    profileImageUrl: supabaseUser.profile_image_url,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at,
    lastLogin: supabaseUser.last_login,
  };
};

export const authService = {
  getCurrentUser: async (): Promise<User> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error('No authenticated user');
      }

      // Get user profile from our users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      return mapSupabaseUser(userProfile);
    } catch (error) {
      throw new Error('Failed to get current user');
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed');
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile) {
        throw new Error('User profile not found');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      return mapSupabaseUser(userProfile);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  signup: async (email: string, password: string, name: string, role: UserRole): Promise<User> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Signup failed');
      }

      // Create user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          role: role.toLowerCase(),
          password_hash: '', // Supabase handles password hashing
          onboarding_complete: false,
          email_verified: false,
        })
        .select()
        .single();

      if (profileError) {
        // If profile creation fails, clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(profileError.message);
      }

      return mapSupabaseUser(userProfile);
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  },

  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          address: updatedUser.address,
          wallet_address: updatedUser.walletAddress,
          phone: updatedUser.phone,
          city: updatedUser.city,
          postcode: updatedUser.postcode,
          country: updatedUser.country,
          profile_image_url: updatedUser.profileImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedUser.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return mapSupabaseUser(data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user');
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  },

  updatePassword: async (newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update password');
    }
  },

  verifyEmail: async (token: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to verify email');
    }
  },
};