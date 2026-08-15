// Environment Configuration
// This file centralizes all environment variables and provides defaults

export const ENV_CONFIG = {
  // Razorpay Configuration
  RAZORPAY: {
    KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_rotatedId999',
    API_BASE: 'https://api.razorpay.com/v1',
  },
  
  // Backend Configuration
  BACKEND: {
    URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  
  // App Configuration
  APP: {
    NAME: process.env.NEXT_PUBLIC_APP_NAME || 'KAMPYN',
    VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
  },
  
  // Feature Flags
  FEATURES: {
    DIRECT_RAZORPAY_API: process.env.NEXT_PUBLIC_DIRECT_RAZORPAY_API === 'true',
    RAZORPAY_FALLBACK: process.env.NEXT_PUBLIC_RAZORPAY_FALLBACK !== 'false',
  }
};

// Validation and logging
export const validateEnvironment = () => {
  const warnings = [];
  const errors = [];
  
  // Check Razorpay configuration
  if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET) {
    errors.push('CRITICAL SECURITY ERROR: NEXT_PUBLIC_RAZORPAY_KEY_SECRET is exposed in client environment. Remove it immediately.');
  }
  
  if (!ENV_CONFIG.RAZORPAY.KEY_ID) {
    warnings.push('RAZORPAY_KEY_ID not set - using default test key');
  }
  
  // Check Backend configuration
  if (!ENV_CONFIG.BACKEND.URL) {
    errors.push('BACKEND_URL not set - API calls will fail');
  }
  
  // Log configuration status
  console.log('🔧 Environment Configuration:', {
    razorpay: {
      keyId: ENV_CONFIG.RAZORPAY.KEY_ID,
      apiBase: ENV_CONFIG.RAZORPAY.API_BASE
    },
    backend: {
      url: ENV_CONFIG.BACKEND.URL
    },
    app: {
      name: ENV_CONFIG.APP.NAME,
      version: ENV_CONFIG.APP.VERSION,
      environment: ENV_CONFIG.APP.ENVIRONMENT
    },
    features: {
      directRazorpayApi: ENV_CONFIG.FEATURES.DIRECT_RAZORPAY_API,
      razorpayFallback: ENV_CONFIG.FEATURES.RAZORPAY_FALLBACK
    }
  });
  
  // Log warnings
  warnings.forEach(warning => console.warn('⚠️', warning));
  
  // Log errors
  errors.forEach(error => console.error('❌', error));
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

// Export default configuration
export default ENV_CONFIG;
