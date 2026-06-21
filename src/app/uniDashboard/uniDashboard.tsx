"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/UniDashboard.module.scss";
import api, { getSubAdmins, deleteSubAdmin } from "@/utils/apiUtils";
import axios from "axios";
import TenantStudioSubadminSignup from "@/app/components/auth/TenantStudioSubadminSignup";

export default function UniDashboardPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<{ _id: string; name: string }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  const [subAdmins, setSubAdmins] = useState<{ _id: string; fullName: string; email: string; phone: string }[]>([]);

  const loadSubAdmins = async () => {
    try {
      const res = await getSubAdmins();
      if (res.data?.success) {
        setSubAdmins(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load sub-administrators", err);
    }
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this sub-administrator account? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await deleteSubAdmin(id);
      if (res.data?.success) {
        loadSubAdmins();
      } else {
        alert(res.data?.message || "Failed to delete sub-administrator.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete sub-administrator.");
    }
  };

  useEffect(() => {
    // Always land on dashboard for this page
    localStorage.removeItem("activeSegment");
    setActiveSegment("dashboard");
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // Load university identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        // Use standardized api utility
        const userRes = await api.get("/api/uni/auth/user");

        if (userRes.status === 200) {
          const user = userRes.data;
          const uniId = user._id || user.id;

          // Store uniId in localStorage
          localStorage.setItem("uniId", uniId);

          const assignRes = await api.get(`/api/university/universities/${uniId}/assignments`);
          const assignJson = assignRes.data;
          if (assignJson.success) {
            setFeatures(assignJson.data.features);
          }
          await loadSubAdmins();
        } else {
          // Failure to get user info, redirect
          router.push("/uni-login");
          return;
        }
      } catch (e) {
        console.error("Failed to init uni dashboard", e);
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          return;
        }
        router.push("/uni-login");
        return;
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);


  // Helper function to get appropriate icon for each feature
  const getFeatureIcon = (featureName: string) => {
    const name = featureName.toLowerCase();
    if (name.includes('food') || name.includes('ordering')) return '🍽️';
    if (name.includes('vendor') || name.includes('merchant')) return '🏪';
    if (name.includes('inventory') || name.includes('stock')) return '📦';
    if (name.includes('analytics') || name.includes('report')) return '📊';
    if (name.includes('payment') || name.includes('billing')) return '💳';
    if (name.includes('user') || name.includes('customer')) return '👥';
    if (name.includes('notification') || name.includes('alert')) return '🔔';
    if (name.includes('setting') || name.includes('config')) return '⚙️';
    return '📋'; // Default icon
  };

  return (
    <div className={styles.dashboardContainer}>
      <main className={styles.main}>
        {/* Loading State */}
        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner}></div>
              <p>Loading your available features...</p>
            </div>
          </div>
        )}

        {/* Dashboard Segment: Feature selection */}
        {activeSegment === "dashboard" && !loading && (
          <div className="space-y-12">
            <div className={styles.featuresSection}>
              <h2 className={styles.sectionTitle}>Available Features</h2>

              <div className={styles.featuresGrid}>
                {features.map((feature) => {
                  const slug = `${feature.name}`
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .trim()
                    .replace(/\s+/g, "-");

                  return (
                    <div
                      key={feature._id}
                      className={`${styles.featureCard} ${styles.fadeInUp}`}
                      onClick={() => {
                        localStorage.removeItem("activeSegment");
                        router.push(`/${slug}-uniDashboard`);
                      }}
                    >
                      <div className={styles.cardContent}>
                        <div className={styles.featureIcon}>
                          {getFeatureIcon(feature.name)}
                        </div>
                        <h3 className={styles.featureTitle}>{feature.name}</h3>
                        <p className={styles.featureDescription}>
                          Access and manage your {feature.name.toLowerCase()} dashboard
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {features.length === 0 && (
                <div className={styles.emptyState}>
                  <p className={styles.emptyDescription}>
                    No features assigned. Please contact your administrator.
                  </p>
                </div>
              )}
                {/* Sub-Admins Management Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                  {/* Left Column: Form */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Add Sub-Administrators</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      Create secondary administrator accounts that can access and configure the Tenant Studio portal.
                    </p>
                    
                    <TenantStudioSubadminSignup onSuccess={loadSubAdmins} />
                  </div>

                  {/* Right Column: List of sub-admins */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Sub-Administrator Accounts</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                      Manage existing sub-administrator login credentials (tenant studio IDs).
                    </p>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {subAdmins.length === 0 ? (
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No sub-administrators registered yet.</p>
                      ) : (
                        subAdmins.map((sub) => (
                          <div 
                            key={sub._id} 
                            className="flex justify-between items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{sub.fullName}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{sub.email}</span>
                              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{sub.phone}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteSubAdmin(sub._id)}
                              className="text-xs font-semibold text-red-500 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

      </main>
    </div>
  );
} 