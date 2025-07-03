import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Vendor } from "../types";
import styles from "../styles/VendorManagement.module.scss";
import Modal from "react-modal";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface Props {
  universityId: string;
}

export function VendorManagement({ universityId }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingVendor, setUpdatingVendor] = useState<string | null>(null);
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${BACKEND_URL}/api/vendor/availability/uni/${universityId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vendors: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const toggleVendorAvailability = async (vendorId: string, currentStatus: "Y" | "N") => {
    try {
      setUpdatingVendor(vendorId);
      const newStatus = currentStatus === "Y" ? "N" : "Y";
      
      const response = await fetch(
        `${BACKEND_URL}/api/vendor/availability/uni/${universityId}/vendor/${vendorId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isAvailable: newStatus }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update vendor: ${response.statusText}`);
      }
      
      // Update the local state
      setVendors(prev => 
        prev.map(vendor => 
          vendor._id === vendorId 
            ? { ...vendor, isAvailable: newStatus }
            : vendor
        )
      );
      
    } catch (err) {
      console.error("Error updating vendor availability:", err);
      alert(`Failed to update vendor: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUpdatingVendor(null);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    setDeleteLoading(true);
    setSuccessMsg("");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/vendor/delete/uni/${universityId}/vendor/${vendorId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete vendor");
      setVendors(vendors.filter(v => v._id !== vendorId));
      setSuccessMsg("Vendor deleted successfully.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete vendor");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeleteVendorId(null);
    }
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditVendor(vendor);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendor) return;
    setEditLoading(true);
    setSuccessMsg("");
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/vendor/update/${editVendor._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editVendor),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vendor");
      setVendors(vendors.map(v => v._id === editVendor._id ? { ...v, ...editVendor } : v));
      setSuccessMsg("Vendor updated successfully.");
      setShowEditModal(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [universityId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading vendors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
          <button onClick={fetchVendors} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const availableVendors = vendors.filter(v => v.isAvailable === "Y");
  const unavailableVendors = vendors.filter(v => v.isAvailable === "N");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Vendor Management</h2>
        <p>Manage vendor availability for your university</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{availableVendors.length}</span>
          <span className={styles.statLabel}>Available Vendors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{unavailableVendors.length}</span>
          <span className={styles.statLabel}>Unavailable Vendors</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{vendors.length}</span>
          <span className={styles.statLabel}>Total Vendors</span>
        </div>
      </div>

      <div className={styles.vendorsList}>
        <h3>All Vendors</h3>
        {vendors.length === 0 ? (
          <p className={styles.noVendors}>No vendors found for this university.</p>
        ) : (
          <div className={styles.vendorsGrid}>
            {vendors.map((vendor) => {
              const isActive = vendor.isAvailable === "Y";
              return (
                <div
                  key={vendor._id}
                  className={`${styles.vendorCard} ${!isActive ? styles.unavailable : styles.active}`}
                  style={isActive ? { cursor: "pointer" } : {}}
                  onClick={() => {
                    if (isActive) router.push(`/uniDashboard/vendor/${vendor._id}`);
                  }}
                >
                  <div className={styles.vendorInfo}>
                    <h4 className={styles.vendorName}>{vendor.fullName}</h4>
                    <p className={styles.vendorEmail}>{vendor.email}</p>
                    <p className={styles.vendorPhone}>{vendor.phone}</p>
                    {vendor.location && (
                      <p className={styles.vendorLocation}>{vendor.location}</p>
                    )}
                  </div>
                  <div className={styles.vendorStatus}>
                    <span className={`${styles.statusBadge} ${vendor.isAvailable === "Y" ? styles.available : styles.unavailable}`}>
                      {vendor.isAvailable === "Y" ? "Available" : "Unavailable"}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleVendorAvailability(vendor._id, vendor.isAvailable);
                      }}
                      disabled={updatingVendor === vendor._id}
                      className={`${styles.toggleButton} ${vendor.isAvailable === "Y" ? styles.turnOff : styles.turnOn}`}
                    >
                      {updatingVendor === vendor._id ? (
                        "Updating..."
                      ) : (
                        vendor.isAvailable === "Y" ? "Turn Off" : "Turn On"
                      )}
                    </button>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      className={styles.toggleButton}
                      onClick={e => {
                        e.stopPropagation();
                        handleEditVendor(vendor);
                      }}
                    >Edit</button>
                    <button
                      className={styles.toggleButton + ' ' + styles.turnOff}
                      onClick={e => {
                        e.stopPropagation();
                        setDeleteVendorId(vendor._id);
                        setShowDeleteModal(true);
                      }}
                      disabled={deleteLoading && deleteVendorId === vendor._id}
                    >{deleteLoading && deleteVendorId === vendor._id ? 'Deleting...' : 'Delete'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Modal
        isOpen={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
        contentLabel="Edit Vendor"
        ariaHideApp={false}
        className={styles.modal}
      >
        <h3>Edit Vendor</h3>
        {editVendor && (
          <form onSubmit={handleEditSubmit} className={styles.modalForm}>
            <label>Name
              <input type="text" value={editVendor.fullName} onChange={e => setEditVendor({ ...editVendor, fullName: e.target.value })} required />
            </label>
            <label>Email
              <input type="email" value={editVendor.email} onChange={e => setEditVendor({ ...editVendor, email: e.target.value })} required />
            </label>
            <label>Phone
              <input type="text" value={editVendor.phone} onChange={e => setEditVendor({ ...editVendor, phone: e.target.value })} required />
            </label>
            <label>Location
              <input type="text" value={editVendor.location || ""} onChange={e => setEditVendor({ ...editVendor, location: e.target.value })} />
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="submit" className={styles.toggleButton} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className={styles.toggleButton} onClick={() => setShowEditModal(false)} disabled={editLoading}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        contentLabel="Delete Vendor"
        ariaHideApp={false}
        style={{ content: { maxWidth: 400, margin: 'auto', borderRadius: 12, textAlign: 'center' } }}
      >
        <h3>Delete Vendor</h3>
        <p>Are you sure you want to delete this vendor?</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button className={styles.toggleButton + ' ' + styles.turnOff} onClick={() => handleDeleteVendor(deleteVendorId!)} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
          <button className={styles.toggleButton} onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
        </div>
      </Modal>
      {successMsg && <div style={{ color: 'green', marginTop: 12 }}>{successMsg}</div>}
    </div>
  );
} 