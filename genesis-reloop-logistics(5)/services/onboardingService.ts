import { supabase } from '../lib/supabase';
import { User, UserRole, VerificationStatus } from '../types';
import { fileUploadService } from './fileUploadService';
import { notificationService } from './notificationService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  data?: any;
}

interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  completed: boolean;
  verificationStatus: VerificationStatus;
}

export const onboardingService = {
  // Initialize onboarding for a new user
  initializeOnboarding: async (userId: string, role: UserRole): Promise<OnboardingProgress> => {
    try {
      const steps = getOnboardingSteps(role);
      
      const progress: OnboardingProgress = {
        userId,
        currentStep: 0,
        totalSteps: steps.length,
        steps,
        completed: false,
        verificationStatus: VerificationStatus.PENDING
      };

      // Store onboarding progress
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: userId,
          current_step: 0,
          total_steps: steps.length,
          steps_data: steps,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return progress;
    } catch (error) {
      console.error('Error initializing onboarding:', error);
      throw error;
    }
  },

  // Get current onboarding progress
  getOnboardingProgress: async (userId: string): Promise<OnboardingProgress | null> => {
    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        userId: data.user_id,
        currentStep: data.current_step,
        totalSteps: data.total_steps,
        steps: data.steps_data || [],
        completed: data.completed,
        verificationStatus: data.verification_status || VerificationStatus.PENDING
      };
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      throw error;
    }
  },

  // Complete a specific onboarding step
  completeStep: async (
    userId: string,
    stepId: string,
    stepData: any
  ): Promise<OnboardingProgress> => {
    try {
      const progress = await getOnboardingProgress(userId);
      if (!progress) throw new Error('Onboarding progress not found');

      // Update the specific step
      const stepIndex = progress.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) throw new Error('Step not found');

      progress.steps[stepIndex].completed = true;
      progress.steps[stepIndex].data = stepData;

      // Move to next step if current step is completed
      if (stepIndex === progress.currentStep) {
        progress.currentStep = Math.min(progress.currentStep + 1, progress.totalSteps - 1);
      }

      // Check if all required steps are completed
      const requiredSteps = progress.steps.filter(step => step.required);
      const completedRequiredSteps = requiredSteps.filter(step => step.completed);
      progress.completed = completedRequiredSteps.length === requiredSteps.length;

      // Update progress in database
      await supabase
        .from('onboarding_progress')
        .update({
          current_step: progress.currentStep,
          steps_data: progress.steps,
          completed: progress.completed,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Update user profile with step data
      await updateUserProfileFromStep(userId, stepId, stepData);

      // Send notification if onboarding is complete
      if (progress.completed) {
        await notificationService.sendNotification(
          userId,
          'ONBOARDING_COMPLETE',
          'Onboarding Complete!',
          'Your account setup is complete. Your profile is now under review.',
          { onboardingComplete: true }
        );
      }

      return progress;
    } catch (error) {
      console.error('Error completing onboarding step:', error);
      throw error;
    }
  },

  // Verify user documents
  verifyDocuments: async (userId: string, documentType: string): Promise<{
    verified: boolean;
    issues: string[];
    nextSteps: string[];
  }> => {
    try {
      // Get user's uploaded documents
      const files = await fileUploadService.getFilesByUser(userId, documentType);
      
      if (files.length === 0) {
        return {
          verified: false,
          issues: ['No documents uploaded'],
          nextSteps: ['Upload required documents']
        };
      }

      // Mock verification process
      const verificationResult = await performDocumentVerification(files, documentType);
      
      // Update file verification status
      for (const file of files) {
        await fileUploadService.updateFileVerificationStatus(
          file.id,
          verificationResult.verified ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED
        );
      }

      // Update user verification status if all documents are verified
      if (verificationResult.verified) {
        await supabase
          .from('users')
          .update({
            verification_status: VerificationStatus.VERIFIED,
            verified_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      return verificationResult;
    } catch (error) {
      console.error('Error verifying documents:', error);
      throw error;
    }
  },

  // Get onboarding checklist for user role
  getOnboardingChecklist: (role: UserRole): OnboardingStep[] => {
    return getOnboardingSteps(role);
  },

  // Skip optional step
  skipStep: async (userId: string, stepId: string): Promise<OnboardingProgress> => {
    try {
      const progress = await getOnboardingProgress(userId);
      if (!progress) throw new Error('Onboarding progress not found');

      const stepIndex = progress.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) throw new Error('Step not found');

      // Mark step as completed (skipped)
      progress.steps[stepIndex].completed = true;
      progress.steps[stepIndex].data = { skipped: true };

      // Move to next step
      if (stepIndex === progress.currentStep) {
        progress.currentStep = Math.min(progress.currentStep + 1, progress.totalSteps - 1);
      }

      // Update progress
      await supabase
        .from('onboarding_progress')
        .update({
          current_step: progress.currentStep,
          steps_data: progress.steps,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      return progress;
    } catch (error) {
      console.error('Error skipping step:', error);
      throw error;
    }
  },

  // Reset onboarding progress
  resetOnboarding: async (userId: string): Promise<void> => {
    try {
      await supabase
        .from('onboarding_progress')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('users')
        .update({
          onboarding_complete: false,
          verification_status: VerificationStatus.PENDING
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  }
};

// Helper functions
function getOnboardingSteps(role: UserRole): OnboardingStep[] {
  const commonSteps: OnboardingStep[] = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Enter your personal details and contact information',
      required: true,
      completed: false
    },
    {
      id: 'address',
      title: 'Address Details',
      description: 'Provide your business address and location',
      required: true,
      completed: false
    },
    {
      id: 'wallet',
      title: 'Wallet Setup',
      description: 'Connect your cryptocurrency wallet for Genesis Points',
      required: true,
      completed: false
    }
  ];

  const driverSteps: OnboardingStep[] = [
    {
      id: 'vehicle_info',
      title: 'Vehicle Information',
      description: 'Provide details about your collection vehicle',
      required: true,
      completed: false
    },
    {
      id: 'license_upload',
      title: 'Driver License',
      description: 'Upload your driving license for verification',
      required: true,
      completed: false
    },
    {
      id: 'vehicle_photo',
      title: 'Vehicle Photo',
      description: 'Upload a photo of your collection vehicle',
      required: true,
      completed: false
    },
    {
      id: 'insurance',
      title: 'Insurance Documents',
      description: 'Upload vehicle insurance documents',
      required: false,
      completed: false
    }
  ];

  const supplierSteps: OnboardingStep[] = [
    {
      id: 'business_info',
      title: 'Business Information',
      description: 'Provide details about your restaurant or business',
      required: true,
      completed: false
    },
    {
      id: 'waste_volume',
      title: 'Waste Volume Estimate',
      description: 'Estimate your monthly UCO production',
      required: true,
      completed: false
    },
    {
      id: 'business_license',
      title: 'Business License',
      description: 'Upload your business license or registration',
      required: false,
      completed: false
    }
  ];

  const buyerSteps: OnboardingStep[] = [
    {
      id: 'facility_info',
      title: 'Facility Information',
      description: 'Provide details about your biofuel facility',
      required: true,
      completed: false
    },
    {
      id: 'processing_capacity',
      title: 'Processing Capacity',
      description: 'Specify your UCO processing capacity',
      required: true,
      completed: false
    },
    {
      id: 'environmental_permits',
      title: 'Environmental Permits',
      description: 'Upload environmental permits and licenses',
      required: true,
      completed: false
    }
  ];

  switch (role) {
    case UserRole.DRIVER:
      return [...commonSteps, ...driverSteps];
    case UserRole.SUPPLIER:
      return [...commonSteps, ...supplierSteps];
    case UserRole.BUYER:
      return [...commonSteps, ...buyerSteps];
    default:
      return commonSteps;
  }
}

async function updateUserProfileFromStep(userId: string, stepId: string, stepData: any): Promise<void> {
  try {
    const updateData: any = {};

    switch (stepId) {
      case 'basic_info':
        updateData.name = stepData.name;
        updateData.phone = stepData.phone;
        break;
      case 'address':
        updateData.address = stepData.address;
        updateData.city = stepData.city;
        updateData.postcode = stepData.postcode;
        updateData.country = stepData.country;
        break;
      case 'wallet':
        updateData.wallet_address = stepData.walletAddress;
        break;
      case 'vehicle_info':
        updateData.vehicle_type = stepData.vehicleType;
        updateData.vehicle_reg = stepData.vehicleReg;
        updateData.vehicle_capacity = stepData.vehicleCapacity;
        break;
      case 'business_info':
        updateData.business_name = stepData.businessName;
        updateData.business_type = stepData.businessType;
        break;
      case 'facility_info':
        updateData.facility_name = stepData.facilityName;
        updateData.facility_type = stepData.facilityType;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
    }
  } catch (error) {
    console.error('Error updating user profile from step:', error);
    throw error;
  }
}

async function performDocumentVerification(files: any[], documentType: string): Promise<{
  verified: boolean;
  issues: string[];
  nextSteps: string[];
}> {
  // Mock verification process
  const issues: string[] = [];
  const nextSteps: string[] = [];

  // Check file types
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  const invalidFiles = files.filter(file => !allowedTypes.includes(file.file_type));
  
  if (invalidFiles.length > 0) {
    issues.push('Invalid file types detected');
    nextSteps.push('Upload files in JPEG, PNG, or PDF format');
  }

  // Check file sizes (max 10MB)
  const oversizedFiles = files.filter(file => file.file_size > 10 * 1024 * 1024);
  if (oversizedFiles.length > 0) {
    issues.push('Some files are too large');
    nextSteps.push('Ensure files are under 10MB');
  }

  // Mock content verification
  if (documentType === 'driver_license') {
    // In a real system, this would use OCR or AI to verify license details
    const hasValidLicense = Math.random() > 0.2; // 80% success rate
    if (!hasValidLicense) {
      issues.push('License details could not be verified');
      nextSteps.push('Ensure license is clearly visible and valid');
    }
  }

  const verified = issues.length === 0;

  if (verified) {
    nextSteps.push('Document verification complete');
  }

  return {
    verified,
    issues,
    nextSteps
  };
}
