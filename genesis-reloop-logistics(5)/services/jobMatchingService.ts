import { Job, User, JobStatus, UserRole } from '../types';
import { mapsService } from './mapsService';
import { supabase } from '../lib/supabase';

interface MatchingCriteria {
  maxDistance: number; // in kilometers
  minRating: number;
  vehicleCapacity: number;
  preferredJobTypes: string[];
  workingHours: {
    start: string;
    end: string;
  };
}

interface JobScore {
  job: Job;
  score: number;
  reasons: string[];
}

export const jobMatchingService = {
  // Main job matching function
  matchJobsToDriver: async (driverId: string, limit: number = 10): Promise<JobScore[]> => {
    try {
      // Get driver profile and preferences
      const driver = await getUserProfile(driverId);
      if (!driver || driver.role !== UserRole.DRIVER) {
        throw new Error('Driver not found or invalid role');
      }

      // Get available jobs
      const availableJobs = await getAvailableJobs();
      
      // Get driver's matching criteria
      const criteria = await getDriverCriteria(driverId);
      
      // Score and rank jobs
      const scoredJobs = await scoreJobs(availableJobs, driver, criteria);
      
      // Sort by score and return top matches
      return scoredJobs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error in job matching:', error);
      throw error;
    }
  },

  // AI-powered matching using OpenRouter
  aiPoweredMatch: async (driverId: string, limit: number = 10): Promise<JobScore[]> => {
    try {
      const driver = await getUserProfile(driverId);
      const availableJobs = await getAvailableJobs();
      
      if (!driver || driver.role !== UserRole.DRIVER) {
        throw new Error('Driver not found or invalid role');
      }

      // Prepare data for AI analysis
      const driverData = {
        id: driver.id,
        name: driver.name,
        location: {
          address: driver.address,
          city: driver.city,
          postcode: driver.postcode,
          coordinates: driver.coordinates
        },
        vehicle: {
          type: driver.vehicleType,
          capacity: driver.vehicleCapacity,
          registration: driver.vehicleReg
        },
        preferences: {
          maxDistance: driver.maxDistance || 50,
          workingHours: driver.workingHours || { start: '08:00', end: '18:00' },
          preferredJobTypes: driver.preferredJobTypes || []
        },
        rating: driver.rating || 0,
        completedJobs: driver.completedJobs || 0
      };

      const jobsData = availableJobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        volume: job.volume,
        contamination: job.contamination,
        pickupLocation: {
          address: job.pickupAddress,
          city: job.pickupCity,
          postcode: job.pickupPostcode,
          coordinates: job.pickupCoordinates
        },
        deliveryLocation: {
          address: job.deliveryAddress,
          city: job.deliveryCity,
          postcode: job.deliveryPostcode,
          coordinates: job.deliveryCoordinates
        },
        urgency: job.urgency,
        estimatedDuration: job.estimatedDuration,
        payment: job.payment,
        requirements: job.requirements || []
      }));

      // Call OpenRouter AI for intelligent matching
      const aiResponse = await callOpenRouterAI(driverData, jobsData);
      
      // Process AI response and create scored jobs
      const scoredJobs: JobScore[] = [];
      
      for (const match of aiResponse.matches) {
        const job = availableJobs.find(j => j.id === match.jobId);
        if (job) {
          scoredJobs.push({
            job,
            score: match.score,
            reasons: match.reasons
          });
        }
      }

      return scoredJobs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error in AI-powered matching:', error);
      // Fallback to rule-based matching
      return jobMatchingService.matchJobsToDriver(driverId, limit);
    }
  },

  // Get driver's current location for real-time matching
  updateDriverLocation: async (driverId: string, latitude: number, longitude: number): Promise<void> => {
    try {
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: driverId,
          latitude,
          longitude,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  },

  // Get nearby jobs based on current location
  getNearbyJobs: async (driverId: string, radius: number = 25): Promise<JobScore[]> => {
    try {
      const driver = await getUserProfile(driverId);
      if (!driver?.coordinates) {
        throw new Error('Driver location not available');
      }

      const availableJobs = await getAvailableJobs();
      const nearbyJobs: JobScore[] = [];

      for (const job of availableJobs) {
        if (job.pickupCoordinates) {
          try {
            const distance = await calculateDistance(
              driver.coordinates,
              job.pickupCoordinates
            );

            if (distance <= radius) {
              nearbyJobs.push({
                job,
                score: calculateProximityScore(distance),
                reasons: [`Within ${Math.round(distance)}km radius`]
              });
            }
          } catch (error) {
            console.warn(`Could not calculate distance for job ${job.id}:`, error);
          }
        }
      }

      return nearbyJobs.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting nearby jobs:', error);
      throw error;
    }
  },

  // Smart job recommendations based on driver history
  getRecommendedJobs: async (driverId: string, limit: number = 5): Promise<JobScore[]> => {
    try {
      const driver = await getUserProfile(driverId);
      const driverHistory = await getDriverJobHistory(driverId);
      
      // Analyze driver preferences from history
      const preferences = analyzeDriverPreferences(driverHistory);
      
      // Get jobs matching preferences
      const availableJobs = await getAvailableJobs();
      const recommendedJobs: JobScore[] = [];

      for (const job of availableJobs) {
        const score = calculateRecommendationScore(job, preferences, driver);
        if (score > 0.3) { // Minimum threshold
          recommendedJobs.push({
            job,
            score,
            reasons: generateRecommendationReasons(job, preferences)
          });
        }
      }

      return recommendedJobs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting recommended jobs:', error);
      throw error;
    }
  }
};

// Helper functions
async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function getAvailableJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', JobStatus.PENDING)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getDriverCriteria(driverId: string): Promise<MatchingCriteria> {
  // Get driver preferences from database or use defaults
  const { data } = await supabase
    .from('driver_profiles')
    .select('*')
    .eq('driver_id', driverId)
    .single();

  return {
    maxDistance: data?.max_distance || 50,
    minRating: data?.min_rating || 3.0,
    vehicleCapacity: data?.vehicle_capacity || 1000,
    preferredJobTypes: data?.preferred_job_types || [],
    workingHours: data?.working_hours || { start: '08:00', end: '18:00' }
  };
}

async function scoreJobs(jobs: Job[], driver: User, criteria: MatchingCriteria): Promise<JobScore[]> {
  const scoredJobs: JobScore[] = [];

  for (const job of jobs) {
    const score = await calculateJobScore(job, driver, criteria);
    if (score.score > 0) {
      scoredJobs.push(score);
    }
  }

  return scoredJobs;
}

async function calculateJobScore(job: Job, driver: User, criteria: MatchingCriteria): Promise<JobScore> {
  let totalScore = 0;
  const reasons: string[] = [];

  // Distance scoring (40% weight)
  if (driver.coordinates && job.pickupCoordinates) {
    try {
      const distance = await calculateDistance(driver.coordinates, job.pickupCoordinates);
      const distanceScore = Math.max(0, 1 - (distance / criteria.maxDistance));
      totalScore += distanceScore * 0.4;
      
      if (distance <= criteria.maxDistance) {
        reasons.push(`Within ${Math.round(distance)}km (${Math.round(distanceScore * 100)}% match)`);
      }
    } catch (error) {
      console.warn(`Distance calculation failed for job ${job.id}:`, error);
    }
  }

  // Volume/capacity matching (25% weight)
  if (driver.vehicleCapacity && job.volume) {
    const capacityMatch = Math.min(1, driver.vehicleCapacity / job.volume);
    totalScore += capacityMatch * 0.25;
    reasons.push(`Capacity match: ${Math.round(capacityMatch * 100)}%`);
  }

  // Job type preference (20% weight)
  if (criteria.preferredJobTypes.length > 0) {
    const jobTypeMatch = criteria.preferredJobTypes.includes(job.jobType || 'standard');
    if (jobTypeMatch) {
      totalScore += 0.2;
      reasons.push('Matches preferred job type');
    }
  }

  // Urgency bonus (10% weight)
  if (job.urgency === 'high') {
    totalScore += 0.1;
    reasons.push('High urgency bonus');
  }

  // Payment attractiveness (5% weight)
  if (job.payment && job.payment > 50) {
    const paymentScore = Math.min(0.05, (job.payment - 50) / 1000);
    totalScore += paymentScore;
    reasons.push(`Good payment: £${job.payment}`);
  }

  return {
    job,
    score: Math.min(1, totalScore),
    reasons
  };
}

async function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): Promise<number> {
  try {
    const result = await mapsService.getDirections(point1, point2);
    // Extract distance from result (assuming it returns distance in km)
    const distanceText = result.distance;
    const distance = parseFloat(distanceText.replace(/[^\d.]/g, ''));
    return distance;
  } catch (error) {
    // Fallback to Haversine formula
    return calculateHaversineDistance(point1, point2);
  }
}

function calculateHaversineDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateProximityScore(distance: number): number {
  return Math.max(0, 1 - (distance / 50)); // Max distance of 50km
}

async function getDriverJobHistory(driverId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('driver_id', driverId)
    .eq('status', JobStatus.COMPLETED)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

function analyzeDriverPreferences(history: Job[]): any {
  const preferences = {
    preferredJobTypes: new Map<string, number>(),
    preferredAreas: new Map<string, number>(),
    averageVolume: 0,
    averagePayment: 0,
    workingHours: { start: '08:00', end: '18:00' }
  };

  if (history.length === 0) return preferences;

  let totalVolume = 0;
  let totalPayment = 0;

  history.forEach(job => {
    // Job type preferences
    const jobType = job.jobType || 'standard';
    preferences.preferredJobTypes.set(jobType, (preferences.preferredJobTypes.get(jobType) || 0) + 1);

    // Area preferences
    const area = job.pickupCity || 'unknown';
    preferences.preferredAreas.set(area, (preferences.preferredAreas.get(area) || 0) + 1);

    totalVolume += job.volume || 0;
    totalPayment += job.payment || 0;
  });

  preferences.averageVolume = totalVolume / history.length;
  preferences.averagePayment = totalPayment / history.length;

  return preferences;
}

function calculateRecommendationScore(job: Job, preferences: any, driver: User): number {
  let score = 0;

  // Job type match
  const jobType = job.jobType || 'standard';
  const typeCount = preferences.preferredJobTypes.get(jobType) || 0;
  if (typeCount > 0) {
    score += 0.3;
  }

  // Area match
  const area = job.pickupCity || '';
  const areaCount = preferences.preferredAreas.get(area) || 0;
  if (areaCount > 0) {
    score += 0.2;
  }

  // Volume similarity
  if (preferences.averageVolume > 0) {
    const volumeSimilarity = 1 - Math.abs((job.volume || 0) - preferences.averageVolume) / preferences.averageVolume;
    score += volumeSimilarity * 0.2;
  }

  // Payment attractiveness
  if (preferences.averagePayment > 0 && job.payment) {
    const paymentRatio = job.payment / preferences.averagePayment;
    if (paymentRatio >= 1) {
      score += 0.3;
    } else {
      score += paymentRatio * 0.3;
    }
  }

  return Math.min(1, score);
}

function generateRecommendationReasons(job: Job, preferences: any): string[] {
  const reasons: string[] = [];

  const jobType = job.jobType || 'standard';
  const typeCount = preferences.preferredJobTypes.get(jobType) || 0;
  if (typeCount > 0) {
    reasons.push(`Similar to ${typeCount} previous jobs`);
  }

  const area = job.pickupCity || '';
  const areaCount = preferences.preferredAreas.get(area) || 0;
  if (areaCount > 0) {
    reasons.push(`Familiar area (${areaCount} previous jobs)`);
  }

  if (job.payment && preferences.averagePayment > 0) {
    const ratio = job.payment / preferences.averagePayment;
    if (ratio > 1.1) {
      reasons.push(`Above average payment (+${Math.round((ratio - 1) * 100)}%)`);
    }
  }

  return reasons;
}

async function callOpenRouterAI(driverData: any, jobsData: any[]): Promise<any> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const prompt = `
You are an AI job matching system for a waste collection logistics platform. 
Match jobs to drivers based on their profile, preferences, and job requirements.

Driver Profile:
${JSON.stringify(driverData, null, 2)}

Available Jobs:
${JSON.stringify(jobsData, null, 2)}

Please analyze and rank the jobs by suitability for this driver. Consider:
1. Proximity to driver location
2. Vehicle capacity vs job volume
3. Driver preferences and working hours
4. Job urgency and payment
5. Driver experience and rating
6. Historical performance patterns

Return a JSON response with this structure:
{
  "matches": [
    {
      "jobId": "job_id",
      "score": 0.85,
      "reasons": ["Within 5km", "Matches vehicle capacity", "High payment"]
    }
  ]
}
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Genesis Reloop Logistics'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenRouter AI call failed:', error);
    throw error;
  }
}