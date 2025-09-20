import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, VerificationStatus } from '../types';
import { fileUploadService } from '../services/fileUploadService';
import { notificationService } from '../services/notificationService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  required: boolean;
  completed: boolean;
}

const EnhancedOnboardingPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      initializeSteps();
    }
  }, [user]);

  const initializeSteps = () => {
    if (!user) return;

    const baseSteps: OnboardingStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to Genesis Reloop',
        description: 'Let\'s get you set up on our platform',
        component: WelcomeStep,
        required: true,
        completed: false,
      },
      {
        id: 'profile',
        title: 'Complete Your Profile',
        description: 'Tell us about yourself and your business',
        component: ProfileStep,
        required: true,
        completed: false,
      },
      {
        id: 'verification',
        title: 'Identity Verification',
        description: 'Verify your identity with official documents',
        component: VerificationStep,
        required: true,
        completed: false,
      },
    ];

    // Add role-specific steps
    if (user.role === UserRole.DRIVER) {
      baseSteps.push(
        {
          id: 'driver_license',
          title: 'Driver License',
          description: 'Upload your driving license for verification',
          component: DriverLicenseStep,
          required: true,
          completed: false,
        },
        {
          id: 'vehicle_info',
          title: 'Vehicle Information',
          description: 'Tell us about your vehicle',
          component: VehicleInfoStep,
          required: true,
          completed: false,
        },
        {
          id: 'insurance',
          title: 'Insurance Details',
          description: 'Provide your insurance information',
          component: InsuranceStep,
          required: true,
          completed: false,
        }
      );
    } else if (user.role === UserRole.SUPPLIER) {
      baseSteps.push(
        {
          id: 'business_info',
          title: 'Business Information',
          description: 'Provide your business details',
          component: BusinessInfoStep,
          required: true,
          completed: false,
        },
        {
          id: 'waste_license',
          title: 'Waste Management License',
          description: 'Upload your waste management license',
          component: WasteLicenseStep,
          required: true,
          completed: false,
        }
      );
    } else if (user.role === UserRole.BUYER) {
      baseSteps.push(
        {
          id: 'facility_info',
          title: 'Facility Information',
          description: 'Tell us about your biofuel facility',
          component: FacilityInfoStep,
          required: true,
          completed: false,
        },
        {
          id: 'processing_license',
          title: 'Processing License',
          description: 'Upload your biofuel processing license',
          component: ProcessingLicenseStep,
          required: true,
          completed: false,
        }
      );
    }

    baseSteps.push(
      {
        id: 'preferences',
        title: 'Preferences',
        description: 'Set your notification and working preferences',
        component: PreferencesStep,
        required: false,
        completed: false,
      },
      {
        id: 'terms',
        title: 'Terms & Conditions',
        description: 'Review and accept our terms of service',
        component: TermsStep,
        required: true,
        completed: false,
      }
    );

    setSteps(baseSteps);
  };

  const handleStepComplete = async (stepId: string, data: any) => {
    try {
      setIsLoading(true);

      // Update step completion status
      setSteps(prev => prev.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      ));

      // Save step data
      await saveStepData(stepId, data);

      // Move to next step
      const nextStepIndex = steps.findIndex(step => step.id === stepId) + 1;
      if (nextStepIndex < steps.length) {
        setCurrentStep(nextStepIndex);
      } else {
        // Complete onboarding
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStepData = async (stepId: string, data: any) => {
    // This would save step data to the database
    console.log(`Saving data for step ${stepId}:`, data);
  };

  const completeOnboarding = async () => {
    try {
      await updateUser({
        ...user!,
        onboardingComplete: true,
        verificationStatus: VerificationStatus.PENDING,
      });

      // Send welcome notification
      await notificationService.createNotification(
        user!.id,
        'SYSTEM',
        'Welcome to Genesis Reloop!',
        'Your account is being verified. You\'ll be notified once verification is complete.',
        { type: 'onboarding_complete' }
      );

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (!user || steps.length === 0) {
    return <div className="text-center py-20">Loading...</div>;
  }

  const currentStepData = steps[currentStep];
  const CurrentStepComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Complete Your Setup</h1>
            <span className="text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card-bg rounded-lg p-8 border border-border-color">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-400">{currentStepData.description}</p>
          </div>

          <CurrentStepComponent
            user={user}
            onComplete={(data) => handleStepComplete(currentStepData.id, data)}
            isLoading={isLoading}
          />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC<any> = ({ onComplete, isLoading }) => {
  const handleNext = () => {
    onComplete({});
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Welcome to Genesis Reloop!</h3>
        <p className="text-gray-400">
          We're excited to have you join our circular economy platform. Let's get you set up in just a few steps.
        </p>
      </div>
      <button
        onClick={handleNext}
        disabled={isLoading}
        className="px-8 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        Get Started
      </button>
    </div>
  );
};

const ProfileStep: React.FC<any> = ({ user, onComplete, isLoading }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postcode: user?.postcode || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Postcode</label>
          <input
            type="text"
            value={formData.postcode}
            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        Continue
      </button>
    </form>
  );
};

const VerificationStep: React.FC<any> = ({ onComplete, isLoading }) => {
  const [documents, setDocuments] = useState<File[]>([]);

  const handleFileUpload = async (files: File[]) => {
    try {
      // Upload documents
      const uploadPromises = files.map(file => 
        fileUploadService.uploadFile(file, 'user_id', 'IDENTITY_VERIFICATION')
      );
      
      await Promise.all(uploadPromises);
      setDocuments(files);
    } catch (error) {
      console.error('Error uploading documents:', error);
    }
  };

  const handleNext = () => {
    onComplete({ documents: documents.length });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Identity Verification</h3>
        <p className="text-gray-400 mb-6">
          Please upload a clear photo of your government-issued ID (passport, driving license, or national ID)
        </p>
      </div>
      
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
          className="hidden"
          id="id-upload"
        />
        <label
          htmlFor="id-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-white font-medium">Click to upload ID document</p>
          <p className="text-gray-400 text-sm">PNG, JPG up to 10MB</p>
        </label>
      </div>
      
      {documents.length > 0 && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-400 text-sm">
            ✓ {documents.length} document(s) uploaded successfully
          </p>
        </div>
      )}
      
      <button
        onClick={handleNext}
        disabled={isLoading || documents.length === 0}
        className="w-full px-6 py-3 bg-primary text-black rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
};

// Additional step components would be implemented here...
const DriverLicenseStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Driver License Step</div>;
};

const VehicleInfoStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Vehicle Info Step</div>;
};

const InsuranceStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Insurance Step</div>;
};

const BusinessInfoStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Business Info Step</div>;
};

const WasteLicenseStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Waste License Step</div>;
};

const FacilityInfoStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Facility Info Step</div>;
};

const ProcessingLicenseStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Processing License Step</div>;
};

const PreferencesStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Preferences Step</div>;
};

const TermsStep: React.FC<any> = ({ onComplete, isLoading }) => {
  return <div>Terms Step</div>;
};

export default EnhancedOnboardingPage;
