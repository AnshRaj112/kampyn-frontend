// The browser may use only Razorpay's public Key ID. All REST operations go
// through the authenticated backend proxy.
export const isRazorpayClientConfigured = (): boolean => {
  return typeof process !== 'undefined' && !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
};
