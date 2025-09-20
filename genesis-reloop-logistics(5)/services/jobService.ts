import { supabase } from '../lib/supabase';
import { Job, JobStatus, JobFilters, PaginatedResponse, ApiResponse } from '../types';

export const jobService = {
  // Get all jobs with optional filters
  getJobs: async (filters?: JobFilters, page = 1, limit = 20): Promise<PaginatedResponse<Job>> => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name, address, city, postcode),
          driver:users!jobs_driver_id_fkey(name, phone),
          buyer:users!jobs_buyer_id_fkey(name, address)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.contamination && filters.contamination.length > 0) {
          query = query.in('contamination', filters.contamination);
        }
        if (filters.state && filters.state.length > 0) {
          query = query.in('oil_state', filters.state);
        }
        if (filters.minVolume) {
          query = query.gte('volume_litres', filters.minVolume);
        }
        if (filters.maxVolume) {
          query = query.lte('volume_litres', filters.maxVolume);
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo);
        }
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch jobs');
    }
  },

  // Get job by ID
  getJobById: async (id: string): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name, address, city, postcode, phone),
          driver:users!jobs_driver_id_fkey(name, phone, vehicle_registration, vehicle_type),
          buyer:users!jobs_buyer_id_fkey(name, address, phone)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Job not found');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch job');
    }
  },

  // Create new job
  createJob: async (jobData: Partial<Job>): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          supplier_id: jobData.supplierId,
          buyer_id: jobData.buyerId,
          title: jobData.title,
          description: jobData.description,
          volume_litres: jobData.volume,
          contamination: jobData.contamination,
          oil_state: jobData.state,
          pickup_address: jobData.pickupAddress,
          delivery_address: jobData.deliveryAddress,
          pickup_coordinates: jobData.pickupCoordinates,
          delivery_coordinates: jobData.deliveryCoordinates,
          special_instructions: jobData.specialInstructions,
          genesis_points_reward: jobData.genesisPointsReward || 0,
          status: JobStatus.PENDING,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create job');
    }
  },

  // Update job
  updateJob: async (id: string, updates: Partial<Job>): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update job');
    }
  },

  // Accept job (for drivers)
  acceptJob: async (jobId: string, driverId: string): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          driver_id: driverId,
          status: JobStatus.ACCEPTED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', JobStatus.PENDING)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Job not available or already accepted');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to accept job');
    }
  },

  // Start job (mark as in progress)
  startJob: async (jobId: string): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          status: JobStatus.IN_PROGRESS,
          actual_pickup_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', JobStatus.ACCEPTED)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Job not available or not accepted');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to start job');
    }
  },

  // Complete job
  completeJob: async (jobId: string, confirmedVolume?: number): Promise<Job> => {
    try {
      const updateData: any = {
        status: JobStatus.COMPLETED,
        actual_delivery_time: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (confirmedVolume) {
        updateData.confirmed_volume_litres = confirmedVolume;
      }

      const { data, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('status', JobStatus.IN_PROGRESS)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Job not available or not in progress');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to complete job');
    }
  },

  // Cancel job
  cancelJob: async (jobId: string, reason?: string): Promise<Job> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          status: JobStatus.CANCELLED,
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .neq('status', JobStatus.COMPLETED)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Job not available or already completed');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel job');
    }
  },

  // Get jobs near location
  getJobsNearLocation: async (
    lat: number,
    lng: number,
    radiusKm: number = 50,
    filters?: JobFilters
  ): Promise<Job[]> => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name, address, city, postcode),
          driver:users!jobs_driver_id_fkey(name, phone),
          buyer:users!jobs_buyer_id_fkey(name, address)
        `)
        .eq('status', JobStatus.PENDING)
        .order('created_at', { ascending: false });

      // Apply additional filters
      if (filters) {
        if (filters.contamination && filters.contamination.length > 0) {
          query = query.in('contamination', filters.contamination);
        }
        if (filters.state && filters.state.length > 0) {
          query = query.in('oil_state', filters.state);
        }
        if (filters.minVolume) {
          query = query.gte('volume_litres', filters.minVolume);
        }
        if (filters.maxVolume) {
          query = query.lte('volume_litres', filters.maxVolume);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Filter by distance (this would ideally be done in the database with PostGIS)
      const jobs = data?.filter((job) => {
        if (!job.pickup_coordinates) return false;
        
        const distance = calculateDistance(
          lat,
          lng,
          job.pickup_coordinates.lat,
          job.pickup_coordinates.lng
        );
        
        return distance <= radiusKm;
      }) || [];

      return jobs;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch nearby jobs');
    }
  },

  // Get driver's active job
  getActiveJob: async (driverId: string): Promise<Job | null> => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name, address, city, postcode, phone),
          buyer:users!jobs_buyer_id_fkey(name, address, phone)
        `)
        .eq('driver_id', driverId)
        .in('status', [JobStatus.ACCEPTED, JobStatus.IN_PROGRESS])
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      return data || null;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch active job');
    }
  },

  // Get jobs by user
  getJobsByUser: async (userId: string, userRole: string): Promise<Job[]> => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          supplier:users!jobs_supplier_id_fkey(name, address, city, postcode),
          driver:users!jobs_driver_id_fkey(name, phone),
          buyer:users!jobs_buyer_id_fkey(name, address)
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (userRole === 'DRIVER') {
        query = query.eq('driver_id', userId);
      } else if (userRole === 'SUPPLIER') {
        query = query.eq('supplier_id', userId);
      } else if (userRole === 'BUYER') {
        query = query.eq('buyer_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch user jobs');
    }
  },
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
