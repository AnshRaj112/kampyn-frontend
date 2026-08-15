import api from './apiUtils';

interface RazorpayInvoiceResponse {
  id: string;
  entity: string;
  invoice_number: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: string;
  description: string;
  notes: Record<string, unknown>;
  customer: {
    name: string;
    contact: string;
    email: string;
  };
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  order_id: string;
  line_items: Array<{
    name: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  payment_terms: Record<string, unknown>;
  partial_payment: boolean;
  date: number;
  due_date: number;
  issued_date: number;
  paid_at: number;
  cancelled_at: number;
  expired_at: number;
  sms_status: string;
  email_status: string;
  short_url: string;
  view_less: boolean;
  type: string;
  group_taxes_discounts: boolean;
  created_at: number;
  updated_at: number;
}

interface RazorpayInvoiceCreateData {
  type: string;
  currency: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    contact: string;
    email: string;
  };
  line_items: Array<{
    name: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  notes?: Record<string, unknown>;
}

/**
 * Fetch invoice details directly via backend proxy
 * @param invoiceId - The Razorpay invoice ID
 * @returns Promise with invoice data
 */
export const fetchRazorpayInvoice = async (invoiceId: string): Promise<RazorpayInvoiceResponse> => {
  try {
    console.log('🔄 Using backend proxy for Razorpay API call');
    const response = await api.get(`/razorpay/invoices/${invoiceId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Razorpay invoice:', error);
    throw error;
  }
};

/**
 * Get invoice PDF URL via backend proxy
 * @param invoiceId - The Razorpay invoice ID
 * @returns Promise with PDF URL
 */
export const getRazorpayInvoicePdf = async (invoiceId: string): Promise<string> => {
  try {
    console.log('🔄 Using backend proxy for Razorpay PDF API call');
    const response = await api.get(`/razorpay/invoices/${invoiceId}/pdf`);
    return response.data.pdfUrl;
  } catch (error) {
    console.error('Error getting invoice PDF:', error);
    throw error;
  }
};

/**
 * Create a new invoice on Razorpay via backend proxy
 * @param invoiceData - Invoice data to create
 * @returns Promise with created invoice data
 */
export const createRazorpayInvoice = async (invoiceData: RazorpayInvoiceCreateData): Promise<RazorpayInvoiceResponse> => {
  try {
    console.log('🔄 Using backend proxy to create invoice');
    const response = await api.post(`/razorpay/invoices`, invoiceData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating Razorpay invoice:', error);
    throw error;
  }
};
