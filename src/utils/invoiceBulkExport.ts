import api from './apiUtils';

const POLL_MS = 1500;
const MAX_WAIT_MS = 5 * 60 * 1000;

export const INVOICE_EXPORT_MAX_DAYS = 31;

type BulkZipPayload = {
  startDate: string;
  endDate: string;
  uniId?: string;
  vendorId?: string;
  invoiceType?: string;
  recipientType?: string;
};

function exportErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data;
    if (data && typeof data.message === 'string') return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function assertInvoiceExportDateRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return 'Please select start and end dates for bulk download';
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Start date and end date must be valid dates';
  }
  if (start > end) return 'Start date must be before end date';
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > INVOICE_EXPORT_MAX_DAYS) {
    return `Date range cannot exceed ${INVOICE_EXPORT_MAX_DAYS} days. Please select a smaller range.`;
  }
  return null;
}

function exportAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function requestBulkInvoiceZip(payload: BulkZipPayload): Promise<Blob> {
  const headers = exportAuthHeaders();
  const enqueue = await api.post('/api/invoices/bulk-zip-download', payload, { headers });
  const jobId = enqueue.data?.data?.jobId as string | undefined;
  if (!jobId) {
    throw new Error(enqueue.data?.message || 'Failed to queue invoice export');
  }

  const started = Date.now();
  while (Date.now() - started < MAX_WAIT_MS) {
    const statusRes = await api.get(`/api/invoices/bulk-zip-jobs/${jobId}`, { headers });
    const status = statusRes.data?.data?.status as string | undefined;
    if (status === 'completed') {
      const fileRes = await api.get(`/api/invoices/bulk-zip-jobs/${jobId}/file`, {
        responseType: 'blob',
        headers
      });
      return fileRes.data as Blob;
    }
    if (status === 'failed') {
      throw new Error(statusRes.data?.data?.error || 'Export failed');
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  throw new Error('Export timed out. Try a smaller date range.');
}

export { exportErrorMessage };
