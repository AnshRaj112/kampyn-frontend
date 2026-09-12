// Environment Configuration
// This file centralizes all environment variables and provides defaults

export const ENV_CONFIG = {
  // Razorpay Configuration
  RAZORPAY: {
    KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_rotatedId999',
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
  
};

// Validation and logging
export const validateEnvironment = () => {
  const warnings = [];
  const errors = [];
  
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
      keyId: ENV_CONFIG.RAZORPAY.KEY_ID
    },
    backend: {
      url: ENV_CONFIG.BACKEND.URL
    },
    app: {
      name: ENV_CONFIG.APP.NAME,
      version: ENV_CONFIG.APP.VERSION,
      environment: ENV_CONFIG.APP.ENVIRONMENT
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
