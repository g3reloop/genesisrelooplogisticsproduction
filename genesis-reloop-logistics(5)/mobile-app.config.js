// Mobile App Configuration for Genesis Reloop Logistics
// This file contains configuration for PWA and mobile app features

export const mobileAppConfig = {
  // PWA Configuration
  pwa: {
    name: 'Genesis Reloop Logistics',
    shortName: 'Genesis Reloop',
    description: 'Circular economy platform for UCO collection and processing',
    themeColor: '#00F0B5',
    backgroundColor: '#0A0F0D',
    display: 'standalone',
    orientation: 'portrait-primary',
    startUrl: '/',
    scope: '/',
    lang: 'en',
    dir: 'ltr',
    categories: ['business', 'productivity', 'utilities']
  },

  // Mobile-specific features
  features: {
    offlineSupport: true,
    pushNotifications: true,
    backgroundSync: true,
    geolocation: true,
    camera: true,
    fileUpload: true,
    biometricAuth: false, // Future feature
    voiceCommands: false // Future feature
  },

  // App icons configuration
  icons: {
    sizes: [72, 96, 128, 144, 152, 192, 384, 512],
    formats: ['png'],
    maskable: true,
    appleTouchIcon: true
  },

  // Splash screens for different devices
  splashScreens: [
    {
      device: 'iPhone 12 Pro Max',
      size: '428x926',
      ratio: '3x'
    },
    {
      device: 'iPhone 12',
      size: '390x844',
      ratio: '3x'
    },
    {
      device: 'iPhone SE',
      size: '375x667',
      ratio: '2x'
    },
    {
      device: 'iPad Pro 12.9',
      size: '1024x1366',
      ratio: '2x'
    },
    {
      device: 'iPad Pro 11',
      size: '834x1194',
      ratio: '2x'
    }
  ],

  // Mobile navigation configuration
  navigation: {
    bottomTabs: [
      {
        id: 'dashboard',
        label: 'Home',
        icon: '🏠',
        path: '/dashboard',
        badge: false
      },
      {
        id: 'jobs',
        label: 'Jobs',
        icon: '📋',
        path: '/mobile-jobs',
        badge: true
      },
      {
        id: 'active',
        label: 'Active',
        icon: '🚛',
        path: '/active-job',
        badge: false
      },
      {
        id: 'earnings',
        label: 'Earnings',
        icon: '💰',
        path: '/earnings',
        badge: false
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: '👤',
        path: '/profile',
        badge: false
      }
    ]
  },

  // Mobile-specific UI settings
  ui: {
    headerHeight: '64px',
    bottomNavHeight: '80px',
    cardPadding: '16px',
    borderRadius: '12px',
    shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    animationDuration: '300ms',
    touchTargetSize: '44px'
  },

  // Performance settings
  performance: {
    lazyLoading: true,
    imageOptimization: true,
    codeSplitting: true,
    caching: {
      static: '1 year',
      dynamic: '1 hour',
      api: '5 minutes'
    }
  },

  // Offline functionality
  offline: {
    enabled: true,
    cacheStrategy: 'networkFirst',
    fallbackPage: '/offline',
    syncWhenOnline: true,
    maxCacheSize: '50MB'
  },

  // Push notification settings
  notifications: {
    enabled: true,
    types: [
      'job_assigned',
      'job_completed',
      'payment_received',
      'genesis_points_earned',
      'system_update'
    ],
    defaultSettings: {
      job_assigned: true,
      job_completed: true,
      payment_received: true,
      genesis_points_earned: true,
      system_update: false
    }
  },

  // Geolocation settings
  geolocation: {
    enabled: true,
    accuracy: 'high',
    timeout: 10000,
    maximumAge: 60000,
    watchPosition: true
  },

  // Camera settings
  camera: {
    enabled: true,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    formats: ['jpeg', 'png'],
    maxFileSize: '10MB'
  },

  // File upload settings
  fileUpload: {
    maxFileSize: '10MB',
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    multiple: true,
    compression: true
  },

  // Analytics and tracking
  analytics: {
    enabled: true,
    trackPageViews: true,
    trackUserInteractions: true,
    trackPerformance: true,
    trackErrors: true,
    privacyMode: true
  },

  // Security settings
  security: {
    httpsRequired: true,
    contentSecurityPolicy: true,
    xssProtection: true,
    clickjackingProtection: true,
    biometricAuth: false // Future feature
  },

  // Accessibility settings
  accessibility: {
    screenReaderSupport: true,
    highContrastMode: true,
    largeTextSupport: true,
    voiceOverSupport: true,
    keyboardNavigation: true
  },

  // Internationalization
  i18n: {
    supportedLanguages: ['en', 'es', 'fr', 'de'],
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    rtlSupport: false
  },

  // App store configuration
  appStore: {
    ios: {
      bundleId: 'com.genesisreloop.logistics',
      version: '1.0.0',
      buildNumber: '1',
      minimumOSVersion: '14.0'
    },
    android: {
      packageName: 'com.genesisreloop.logistics',
      versionCode: 1,
      versionName: '1.0.0',
      minimumSDKVersion: 21,
      targetSDKVersion: 33
    }
  }
};

export default mobileAppConfig;
