import { isRazorpayClientConfigured } from '../config/razorpay';
import { ENV_CONFIG, validateEnvironment } from '../config/environment';

/**
 * Initialize Razorpay client configuration (checks env only)
 */
export const initializeRazorpay = (keyId?: string, keySecret?: string) => {
  try {
    // Validate environment first
    const envStatus = validateEnvironment();
    
    if (keySecret || process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET) {
      console.error('❌ CRITICAL SECURITY ERROR: Attempted to initialize Razorpay with a Key Secret on the client.');
    }
    
    const configured = isRazorpayClientConfigured();
    
    if (configured) {
      console.log('✅ Razorpay client configured using public Key ID:', ENV_CONFIG.RAZORPAY.KEY_ID);
    } else {
      console.warn('⚠️ Razorpay Key ID not configured in environment variables');
    }
    
    return {
      success: configured,
      environment: ENV_CONFIG.APP.ENVIRONMENT,
      apiBase: 'Backend proxy',
      warnings: envStatus.warnings,
      errors: envStatus.errors
    };
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Auto-initialize Razorpay from environment variables
 */
export const autoInitializeRazorpay = () => {
  return initializeRazorpay();
};

/**
 * Check if Razorpay is properly configured on the client
 */
export const isRazorpayInitialized = () => {
  return isRazorpayClientConfigured();
};

/**
 * Get Razorpay initialization status
 */
export const getRazorpayStatus = () => {
  const initialized = Boolean(isRazorpayInitialized());
  const envStatus = validateEnvironment();
  
  return {
    initialized,
    message: initialized 
      ? 'Razorpay ready via backend proxy' 
      : 'Razorpay not configured',
    apiBase: 'Backend proxy',
    environment: (ENV_CONFIG.APP.ENVIRONMENT as "development" | "production" | "test") || 'development',
    keyId: ENV_CONFIG.RAZORPAY.KEY_ID || '',
    hasSecret: false,
    warnings: envStatus.warnings,
    errors: envStatus.errors
  };
};

/**
 * Get environment configuration summary
 */
export const getEnvironmentSummary = () => {
  return {
    razorpay: {
      keyId: ENV_CONFIG.RAZORPAY.KEY_ID,
      hasSecret: false,
      apiBase: 'Backend proxy'
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
      directRazorpayApi: false,
      razorpayFallback: ENV_CONFIG.FEATURES.RAZORPAY_FALLBACK
    }
  };
};
