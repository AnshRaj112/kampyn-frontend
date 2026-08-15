// Razorpay Configuration
// Note: In production, these should be securely managed and not exposed in client-side code

export const RAZORPAY_CONFIG = {
  // API Base URL - This will hit Razorpay directly
  API_BASE: 'https://api.razorpay.com/v1',
  
  // API Endpoints
  ENDPOINTS: {
    INVOICES: '/invoices',
    INVOICE_BY_ID: (id: string) => `/invoices/${id}`,
    INVOICE_PDF: (id: string) => `/invoices/${id}/pdf`,
  },
  
  // Currency
  CURRENCY: 'INR',
  
  // Default invoice settings
  DEFAULT_INVOICE_SETTINGS: {
    currency: 'INR',
    type: 'invoice',
    partial_payment: false,
    sms_notify: 0,
    email_notify: 0,
  }
};

// Function to get Razorpay public key configuration status (safely, without secrets)
export const isRazorpayClientConfigured = (): boolean => {
  if (typeof window !== 'undefined') {
    const keyId = (window as { RAZORPAY_KEY_ID?: string }).RAZORPAY_KEY_ID;
    if (keyId) return true;
  }
  return typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
};
