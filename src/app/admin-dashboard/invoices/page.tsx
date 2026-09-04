'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileTextIcon, DownloadIcon, EyeIcon, DollarSignIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './styles/invoices.module.scss';
import { assertInvoiceExportDateRange, exportErrorMessage, requestBulkInvoiceZip } from '@/utils/invoiceBulkExport';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  orderNumber: string;
  uniName: string;
  vendorName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  pdfUrl: string;
  razorpayInvoiceUrl: string;
  invoiceType: 'vendor' | 'platform';
  recipientType: 'vendor' | 'admin' | 'university';
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalInvoices: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalInvoices: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    invoiceType: 'platform', // Default to platform invoices only
    recipientType: '',
    searchTerm: '',
    page: 1,
    limit: 25
  });
  const [stats, setStats] = useState({
    platformInvoices: 0,
    platformFeeAmount: 0,
  });

  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`${API_BASE}/api/invoices/admin?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data.invoices);
        setPagination(data.data.pagination);
      } else {
        setError(data.message || 'Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [filters, API_BASE]);

  const fetchStats = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      queryParams.append('invoiceType', 'platform'); // Only fetch platform invoice stats

      const response = await fetch(`${API_BASE}/api/invoices/stats?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setStats({
          platformInvoices: data.data.counts.platform || 0,
          platformFeeAmount: data.data.amounts.platform || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [filters.startDate, filters.endDate, API_BASE]);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [fetchInvoices, fetchStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const downloadInvoice = (invoice: Invoice) => {
    // Always use backend PDF download endpoint first
    if (invoice._id) {
      window.open(`${API_BASE}/api/invoices/${invoice._id}/download`, '_blank');
    } else if (invoice.pdfUrl) {
      // Fallback to direct PDF URL if available
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  const viewRazorpayInvoice = (invoice: Invoice) => {
    if (invoice.razorpayInvoiceUrl) {
      window.open(invoice.razorpayInvoiceUrl, '_blank');
    }
  };

  const downloadBulkInvoices = async () => {
    const rangeError = assertInvoiceExportDateRange(filters.startDate, filters.endDate);
    if (rangeError) {
      alert(rangeError);
      return;
    }

    try {
      const blob = await requestBulkInvoiceZip({
        startDate: filters.startDate,
        endDate: filters.endDate,
        invoiceType: filters.invoiceType || undefined,
        recipientType: filters.recipientType || undefined
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_${filters.startDate}_to_${filters.endDate}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading bulk invoices:', error);
      alert(exportErrorMessage(error, 'Failed to download invoices'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'bg-blue-100 text-blue-800';
      case 'platform': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecipientTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'bg-orange-100 text-orange-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'university': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className={styles.invoicesPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Platform Invoice Management</h1>
            <p className={styles.subtitle}>View and manage platform fee invoices and earnings</p>
          </div>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className={styles.backButton}
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <CardContent className={styles.statContent}>
            <div className={styles.statIcon}>
              <FileTextIcon />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>{stats.platformInvoices}</div>
              <div className={styles.statLabel}>Platform Invoices</div>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.statCard}>
          <CardContent className={styles.statContent}>
            <div className={styles.statIcon}>
              <DollarSignIcon />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>₹{stats.platformFeeAmount.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Platform Fee Earned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={styles.filtersCard}>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <Select value={filters.status} onValueChange={(value: string) => handleFilterChange('status', value)}>
                <SelectTrigger className={styles.filterInput}>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Invoice Type</label>
              <Select value={filters.invoiceType} onValueChange={(value: string) => handleFilterChange('invoiceType', value)}>
                <SelectTrigger className={`${styles.filterInput} ${styles.disabledInput}`}>
                  <SelectValue placeholder="Platform Only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Recipient Type</label>
              <Select value={filters.recipientType} onValueChange={(value: string) => handleFilterChange('recipientType', value)}>
                <SelectTrigger className={styles.filterInput}>
                  <SelectValue placeholder="All Recipients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Recipients</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="university">University</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search</label>
              <Input
                placeholder="Search invoices..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Items per page</label>
              <Select value={filters.limit.toString()} onValueChange={(value: string) => handleFilterChange('limit', value)}>
                <SelectTrigger className={styles.filterInput}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={styles.filterActions}>
            <Button onClick={fetchInvoices} className={styles.applyButton}>
              Apply Filters
            </Button>
            <Button 
              onClick={downloadBulkInvoices} 
              variant="outline"
              className={styles.downloadButton}
              disabled={!filters.startDate || !filters.endDate}
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download All (ZIP)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className={styles.invoicesCard}>
        <CardHeader>
          <CardTitle>Platform Invoices ({pagination.totalInvoices})</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className={styles.errorMessage}>
              {error}
            </div>
          ) : invoices.length === 0 ? (
            <div className={styles.emptyState}>
              <FileTextIcon className={styles.emptyIcon} />
              <h3>No platform invoices found</h3>
              <p>No platform fee invoices match your current filter criteria.</p>
            </div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.invoicesTable}>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Order #</th>
                      <th>University</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Recipient</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id}>
                        <td className={styles.invoiceNumber}>
                          {invoice.invoiceNumber}
                        </td>
                        <td>{invoice.orderNumber}</td>
                        <td>{invoice.uniName}</td>
                        <td>{invoice.vendorName}</td>
                        <td className={styles.amount}>₹{invoice.totalAmount}</td>
                        <td>
                          <Badge className={getInvoiceTypeColor(invoice.invoiceType)}>
                            {invoice.invoiceType}
                          </Badge>
                        </td>
                        <td>
                          <Badge className={getRecipientTypeColor(invoice.recipientType)}>
                            {invoice.recipientType}
                          </Badge>
                        </td>
                        <td>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </td>
                        <td className={styles.date}>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadInvoice(invoice)}
                              disabled={!invoice.pdfUrl && !invoice._id}
                              className={styles.actionButton}
                            >
                              <DownloadIcon className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewRazorpayInvoice(invoice)}
                              disabled={!invoice.razorpayInvoiceUrl}
                              className={styles.actionButton}
                            >
                              <EyeIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <div className={styles.paginationInfo}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                    ({pagination.totalInvoices} total platform invoices)
                  </div>
                  <div className={styles.paginationButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicesPage;
