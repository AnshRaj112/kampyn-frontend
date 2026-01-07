'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './styles/platformFees.module.scss';

interface University {
  _id: string;
  fullName: string;
  email: string;
  platformFee?: number;
  isVerified: boolean;
  isAvailable: string;
  totalVendors: number;
  activeVendors: number;
}

interface PlatformFeeUpdate {
  uniId: string;
  platformFee: number;
}

const PlatformFeesPage: React.FC = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFees, setEditingFees] = useState<{ [key: string]: number }>({});
  const [bulkFee, setBulkFee] = useState<number>(0);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Fetch universities data
  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/universities`);
      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }
      
      const data = await response.json();
      if (data.success) {
        setUniversities(data.data);
        // Initialize editing fees with current values
        const initialFees: { [key: string]: number } = {};
        data.data.forEach((uni: University) => {
          // Respect stored zero values; fall back to 0 only when unset
          initialFees[uni._id] = uni.platformFee ?? 0;
        });
        setEditingFees(initialFees);
      } else {
        throw new Error(data.message || 'Failed to fetch universities');
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  // Update individual platform fee
  const updatePlatformFee = async (uniId: string, platformFee: number) => {
    try {
      setSaving(uniId);
      setError(null);
      setSuccess(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/universities/${uniId}/platform-fee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platformFee }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update platform fee');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setUniversities(prev => 
          prev.map(uni => 
            uni._id === uniId 
              ? { ...uni, platformFee: platformFee }
              : uni
          )
        );
        setSuccess(`Platform fee updated successfully for ${data.university.fullName}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to update platform fee');
      }
    } catch (err) {
      console.error('Error updating platform fee:', err);
      setError(err instanceof Error ? err.message : 'Failed to update platform fee');
    } finally {
      setSaving(null);
    }
  };

  // Bulk update platform fees
  const bulkUpdateFees = async () => {
    try {
      setSaving('bulk');
      setError(null);
      setSuccess(null);

      const updates: PlatformFeeUpdate[] = universities.map(uni => ({
        uniId: uni._id,
        platformFee: bulkFee
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/universities/bulk-platform-fees`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bulk update platform fees');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setUniversities(prev => 
          prev.map(uni => ({ ...uni, platformFee: bulkFee }))
        );
        setEditingFees(prev => {
          const newFees: { [key: string]: number } = {};
          Object.keys(prev).forEach(uniId => {
            newFees[uniId] = bulkFee;
          });
          return newFees;
        });
        setSuccess(`Platform fees updated successfully for ${data.updatedCount} universities`);
        setShowBulkUpdate(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to bulk update platform fees');
      }
    } catch (err) {
      console.error('Error bulk updating platform fees:', err);
      setError(err instanceof Error ? err.message : 'Failed to bulk update platform fees');
    } finally {
      setSaving(null);
    }
  };

  // Handle individual fee change
  const handleFeeChange = (uniId: string, value: string) => {
    const fee = parseFloat(value);
    if (!isNaN(fee) && fee >= 0) {
      setEditingFees(prev => ({ ...prev, [uniId]: fee }));
    }
  };

  // Handle individual fee save
  const handleSaveFee = (uniId: string) => {
    const fee = editingFees[uniId];
    if (fee !== undefined && fee >= 0) {
      updatePlatformFee(uniId, fee);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loader} />
        <p>Loading universities...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Platform Fee Management</h1>
        <p className={styles.subtitle}>
          Set and manage platform fees for each university. Platform fees are charged per order.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className={`${styles.alert} ${styles.errorAlert}`}>
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={`${styles.alert} ${styles.successAlert}`}>
          <CheckCircle className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Bulk Update Section */}
      <Card className={styles.bulkUpdateCard}>
        <CardHeader>
          <CardTitle>Bulk Update Platform Fees</CardTitle>
          <CardDescription>
            Update platform fees for all universities at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.bulkUpdateForm}>
            <div className={styles.inputGroup}>
              <Label htmlFor="bulkFee">Platform Fee (₹)</Label>
              <Input
                id="bulkFee"
                type="number"
                min="0"
                step="0.01"
                value={bulkFee}
                onChange={(e) => setBulkFee(parseFloat(e.target.value) || 0)}
                placeholder="Enter platform fee"
              />
            </div>
            <div className={styles.buttonGroup}>
              <Button
                onClick={() => setShowBulkUpdate(!showBulkUpdate)}
                variant="outline"
              >
                {showBulkUpdate ? 'Cancel' : 'Bulk Update'}
              </Button>
              {showBulkUpdate && (
                <Button
                  onClick={bulkUpdateFees}
                  disabled={saving === 'bulk'}
                  className={styles.saveButton}
                >
                  {saving === 'bulk' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update All ({universities.length} universities)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Universities List */}
      <div className={styles.universitiesGrid}>
        {universities.map((uni) => (
          <Card key={uni._id} className={styles.universityCard}>
            <CardHeader>
              <div className={styles.universityHeader}>
                <div>
                  <CardTitle className={styles.universityName}>
                    {uni.fullName}
                  </CardTitle>
                  <CardDescription className={styles.universityEmail}>
                    {uni.email}
                  </CardDescription>
                </div>
                <div className={styles.badges}>
                  <Badge 
                    variant={uni.isVerified ? "default" : "secondary"}
                    className={styles.verificationBadge}
                  >
                    {uni.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <Badge 
                    variant={uni.isAvailable === 'Y' ? "default" : "destructive"}
                    className={styles.availabilityBadge}
                  >
                    {uni.isAvailable === 'Y' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={styles.universityStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Total Vendors:</span>
                  <span className={styles.statValue}>{uni.totalVendors}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Active Vendors:</span>
                  <span className={styles.statValue}>{uni.activeVendors}</span>
                </div>
              </div>
              
              <div className={styles.feeSection}>
                <Label htmlFor={`fee-${uni._id}`}>Platform Fee (₹)</Label>
                <div className={styles.feeInputGroup}>
                  <Input
                    id={`fee-${uni._id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingFees[uni._id] ?? uni.platformFee ?? 0}
                    onChange={(e) => handleFeeChange(uni._id, e.target.value)}
                    placeholder="Enter platform fee"
                    className={styles.feeInput}
                  />
                  <Button
                    onClick={() => handleSaveFee(uni._id)}
                    disabled={saving === uni._id}
                    size="sm"
                    className={styles.saveFeeButton}
                  >
                    {saving === uni._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className={styles.currentFee}>
                  Current: ₹{uni.platformFee ?? 0} per order
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <div className={styles.refreshSection}>
        <Button
          onClick={fetchUniversities}
          variant="outline"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default PlatformFeesPage;
