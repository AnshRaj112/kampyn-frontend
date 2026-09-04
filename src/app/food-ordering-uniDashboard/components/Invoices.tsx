"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ENV_CONFIG } from "@/config/environment";
import api from "@/utils/apiUtils";
import { assertInvoiceExportDateRange, exportErrorMessage, requestBulkInvoiceZip } from "@/utils/invoiceBulkExport";
import styles from "../styles/Invoices.module.scss";

interface InvoiceRow {
  _id: string;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  vendorId?: { _id?: string; name?: string; fullName?: string } | string;
  pdfUrl?: string | null;
  razorpayInvoiceUrl?: string | null;
}

interface VendorInvoiceGroup {
  vendorId: string;
  vendorName: string;
  invoices: InvoiceRow[];
  totalAmount: number;
  invoiceCount: number;
}

interface Props {
  universityId: string;
}

export default function Invoices({ universityId }: Props) {
  const [, setInvoices] = useState<InvoiceRow[]>([]);
  const [vendorGroups, setVendorGroups] = useState<VendorInvoiceGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const loadInvoices = useCallback(async () => {
    if (!universityId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/invoices/university/${universityId}`, {
        params: {
          limit: 100,
          invoiceType: "vendor",
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      const json = res.data;
      if (json?.success) {
        const invoiceData = json.data?.invoices || [];
        setInvoices(invoiceData);
        groupInvoicesByVendor(invoiceData);
      } else {
        setError(json?.message || "Failed to load invoices");
      }
    } catch {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [universityId, startDate, endDate]);

  const groupInvoicesByVendor = (invoiceData: InvoiceRow[]) => {
    const groups: { [key: string]: VendorInvoiceGroup } = {};

    invoiceData.forEach((invoice) => {
      const isVendorObj = invoice.vendorId && typeof invoice.vendorId === "object";
      const vendorObj = isVendorObj ? (invoice.vendorId as { _id?: string; name?: string; fullName?: string }) : null;
      const vendorId = vendorObj ? (vendorObj._id || "unknown") : (invoice.vendorId as string || "unknown");
      const vendorName = vendorObj
        ? (vendorObj.fullName || vendorObj.name || "Unknown Vendor")
        : "Unknown Vendor";

      const safeVendorId = typeof vendorId === "string" ? vendorId : "unknown";

      if (!groups[safeVendorId]) {
        groups[safeVendorId] = {
          vendorId: safeVendorId,
          vendorName,
          invoices: [],
          totalAmount: 0,
          invoiceCount: 0
        };
      }

      groups[safeVendorId].invoices.push(invoice);
      groups[safeVendorId].totalAmount += invoice.totalAmount || 0;
      groups[safeVendorId].invoiceCount += 1;
    });

    // Sort vendors by total amount (descending)
    const sortedGroups = Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
    setVendorGroups(sortedGroups);
  };

  useEffect(() => {
    if (universityId) {
      loadInvoices();
    }
  }, [universityId, loadInvoices]);

  const downloadInvoice = (invoiceId: string) => {
    window.open(`${ENV_CONFIG.BACKEND.URL}/api/invoices/${invoiceId}/download`, "_blank");
  };

  const downloadBulkInvoices = async () => {
    const rangeError = assertInvoiceExportDateRange(startDate, endDate);
    if (rangeError) {
      alert(rangeError);
      return;
    }

    try {
      setBulkDownloadLoading(true);
      const blob = await requestBulkInvoiceZip({
        startDate,
        endDate,
        uniId: universityId,
        invoiceType: 'vendor',
        recipientType: 'vendor'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor_invoices_${startDate}_to_${endDate}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Bulk download error:', error);
      alert(exportErrorMessage(error, 'Failed to download bulk invoices'));
    } finally {
      setBulkDownloadLoading(false);
    }
  };

  const toggleVendorExpansion = (vendorId: string) => {
    const newExpanded = new Set(expandedVendors);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    setExpandedVendors(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className={styles.invoicesContainer}>
      {/* Header and Controls */}
      <div className={styles.header}>
        <h2 className={styles.title}>Vendor Invoices</h2>
        <p className={styles.subtitle}>Invoices organized by vendor with filtering and bulk download options</p>

        {/* Date Filters and Bulk Download */}
        <div className={styles.controls}>
          <div className={styles.dateFilters}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
            />
          </div>
          <div className={styles.actionButtons}>
            {vendorGroups.length > 0 && (
              <button
                onClick={() => {
                  if (expandedVendors.size === vendorGroups.length) {
                    setExpandedVendors(new Set());
                  } else {
                    setExpandedVendors(new Set(vendorGroups.map(g => g.vendorId)));
                  }
                }}
                className={styles.expandCollapseBtn}
              >
                {expandedVendors.size === vendorGroups.length ? "Collapse All" : "Expand All"}
              </button>
            )}
            <button
              onClick={downloadBulkInvoices}
              disabled={!startDate || !endDate || bulkDownloadLoading}
              className={styles.downloadBtn}
            >
              {bulkDownloadLoading ? "Downloading..." : "Download ZIP"}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading invoices...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && vendorGroups.length === 0 && !error && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <div className={styles.emptyTitle}>No vendor invoices found</div>
          <div className={styles.emptyDescription}>
            {startDate || endDate ? "for the selected date range" : "for this university"}
          </div>
        </div>
      )}

      {/* Vendor Groups */}
      {vendorGroups.length > 0 && (
        <div className={styles.vendorGroups}>
          {vendorGroups.map((group) => {
            const isExpanded = expandedVendors.has(group.vendorId);

            return (
              <div key={group.vendorId} className={styles.vendorCard}>
                {/* Vendor Header */}
                <div
                  className={styles.vendorHeader}
                  onClick={() => toggleVendorExpansion(group.vendorId)}
                >
                  <div className={styles.headerContent}>
                    <div className={styles.vendorInfo}>
                      <div className={styles.vendorName}>
                        Invoices of {group.vendorName}
                      </div>
                      <div className={styles.invoiceBadge}>
                        {group.invoiceCount} invoices
                      </div>
                    </div>
                    <div className={styles.vendorStats}>
                      <div className={styles.totalAmount}>
                        <div className={styles.amountLabel}>Total Amount</div>
                        <div className={styles.amountValue}>
                          {formatCurrency(group.totalAmount)}
                        </div>
                      </div>
                      <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor Invoices Table */}
                {isExpanded && (
                  <div className={styles.invoicesTable}>
                    <table>
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.invoices
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((invoice) => (
                            <tr key={invoice._id}>
                              <td>
                                <span className={styles.invoiceNumber}>{invoice.invoiceNumber}</span>
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${invoice.status ? styles[invoice.status] : ""}`}>
                                  {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : "Unknown"}
                                </span>
                              </td>
                              <td>
                                <span className={styles.amount}>
                                  {formatCurrency(invoice.totalAmount || 0)}
                                </span>
                              </td>
                              <td>
                                <span className={styles.date}>{formatDate(invoice.createdAt)}</span>
                              </td>
                              <td>
                                <button
                                  className={styles.downloadBtn}
                                  onClick={() => downloadInvoice(invoice._id)}
                                >
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {vendorGroups.length > 0 && (
        <div className={styles.summaryStats}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.vendors}`}>{vendorGroups.length}</div>
              <div className={styles.statLabel}>Vendors</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.invoices}`}>
                {vendorGroups.reduce((sum, group) => sum + group.invoiceCount, 0)}
              </div>
              <div className={styles.statLabel}>Total Invoices</div>
            </div>
            <div className={styles.statItem}>
              <div className={`${styles.statValue} ${styles.amount}`}>
                {formatCurrency(vendorGroups.reduce((sum, group) => sum + group.totalAmount, 0))}
              </div>
              <div className={styles.statLabel}>Total Amount</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}