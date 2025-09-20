// Comprehensive types for Genesis Reloop Logistics platform

export enum UserRole {
  SUPPLIER = 'SUPPLIER',
  DRIVER = 'DRIVER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

export enum OilContamination {
  NONE = 'NONE',
  LOW = 'LOW',
  HIGH = 'HIGH',
}

export enum OilState {
  LIQUID = 'LIQUID',
  SOLID = 'SOLID',
  MIXED = 'MIXED',
}

export enum JobStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  JOB_UPDATE = 'JOB_UPDATE',
  EARNINGS = 'EARNINGS',
  SYSTEM = 'SYSTEM',
  PROMOTIONAL = 'PROMOTIONAL',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboardingComplete: boolean;
  emailVerified: boolean;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  walletAddress?: string;
  isActive: boolean;
  verificationStatus: VerificationStatus;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  // Driver specific
  vehicleReg?: string;
  vehicleType?: string;
  licenseNumber?: string;
  licenseVerified?: boolean;
  // Supplier specific
  companiesHouseNumber?: string;
  businessName?: string;
  // Buyer specific
  facilityName?: string;
  facilityType?: string;
}

export interface Job {
  id: string;
  supplierId: string;
  driverId?: string;
  buyerId?: string;
  title: string;
  description?: string;
  volume: number; // in litres
  confirmedVolume?: number;
  contamination: OilContamination;
  state: OilState;
  status: JobStatus;
  priority: number;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCoordinates?: {
    lat: number;
    lng: number;
  };
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  genesisPointsReward: number;
  paymentAmount?: number;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  // Legacy fields for backward compatibility
  supplierName?: string;
  supplierAddress?: string;
  lat?: number;
  lng?: number;
  plantName?: string;
  plantAddress?: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber?: string;
  licenseVerified: boolean;
  licenseExpiryDate?: string;
  vehicleRegistration?: string;
  vehicleType?: string;
  vehicleCapacityLitres?: number;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  backgroundCheckCompleted: boolean;
  backgroundCheckDate?: string;
  containerCount: number;
  totalEarnings: number;
  genesisPoints: number;
  rating: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProfile {
  id: string;
  userId: string;
  businessName?: string;
  companiesHouseNumber?: string;
  vatNumber?: string;
  businessType?: string;
  averageMonthlyVolume?: number;
  preferredCollectionTimes?: string[];
  contactPerson?: string;
  contactPhone?: string;
  totalCollections: number;
  totalVolumeCollected: number;
  totalRebates: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfile {
  id: string;
  userId: string;
  facilityName?: string;
  facilityType?: string;
  processingCapacityDaily?: number;
  qualityRequirements?: string;
  paymentTerms?: string;
  contactPerson?: string;
  contactPhone?: string;
  totalPurchases: number;
  totalVolumePurchased: number;
  createdAt: string;
  updatedAt: string;
}

export interface DWTNRecord {
  id: string;
  jobId: string;
  dwtnNumber: string;
  blockchainTxHash?: string;
  blockchainBlockNumber?: number;
  supplierDetails: Record<string, any>;
  driverDetails: Record<string, any>;
  buyerDetails: Record<string, any>;
  wasteDetails: Record<string, any>;
  collectionDetails: Record<string, any>;
  deliveryDetails: Record<string, any>;
  complianceData: Record<string, any>;
  createdAt: string;
  verifiedAt?: string;
  ipfsHash?: string;
}

export interface GenesisPoints {
  id: string;
  userId: string;
  jobId?: string;
  points: number;
  pointsType: string;
  description?: string;
  multiplier: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  jobId?: string;
  amount: number;
  currency: string;
  transactionType: string;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  status: PaymentStatus;
  description?: string;
  metadata: Record<string, any>;
  createdAt: string;
  processedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface FileUpload {
  id: string;
  userId: string;
  jobId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  fileCategory?: string;
  verificationStatus: VerificationStatus;
  uploadedAt: string;
}

export interface DriverLocation {
  id: string;
  driverId: string;
  jobId?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  accuracy?: number;
  heading?: number;
  speed?: number;
  isOnline: boolean;
  recordedAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description?: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface JobForm {
  title: string;
  description?: string;
  volume: number;
  contamination: OilContamination;
  state: OilState;
  pickupAddress: string;
  deliveryAddress: string;
  specialInstructions?: string;
}

export interface ProfileForm {
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  walletAddress?: string;
}

// Map types
export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  description?: string;
  type: 'job' | 'driver' | 'supplier' | 'buyer';
  data: Job | User;
}

// Chart types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

// Search and filter types
export interface JobFilters {
  status?: JobStatus[];
  contamination?: OilContamination[];
  state?: OilState[];
  minVolume?: number;
  maxVolume?: number;
  dateFrom?: string;
  dateTo?: string;
  radius?: number;
  center?: {
    lat: number;
    lng: number;
  };
}

export interface UserFilters {
  role?: UserRole[];
  verificationStatus?: VerificationStatus[];
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}