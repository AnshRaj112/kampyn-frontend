"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AiOutlineMenu } from "react-icons/ai";
import Sidebar from "./components/Sidebar";
import { VendorManagement } from "./components/VendorManagement";
import { AddVendorForm } from "./components/AddVendorForm";
// import { ImageUploadSection } from "./components/ImageUploadSection";
import { UploadItemForm } from "./components/UploadItemForm";
import ManageItems from "./components/ManageItems";
import ManageCharges from "./components/ManageCharges";
import Invoices from "./components/Invoices";
import Review from "./components/Review";
import TaxUpdating from "./components/TaxUpdating";
import UniGrievances from "./components/UniGrievances";
import UniversityRecipes from "./components/UniversityRecipes";
import MenuSorting from "./components/MenuSorting";
import styles from "./styles/InventoryReport.module.scss";

import UniProfile from "./components/UniProfile";
import api from "@/utils/apiUtils";
import axios from "axios";

export default function UniDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [universityName, setUniversityName] = useState<string>("University");
  const [services, setServices] = useState<{ _id: string; name: string; feature: { _id: string; name: string } }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("activeSegment");
    // If no saved segment or coming from uniDashboard, default to dashboard
    if (saved && saved !== "dashboard") {
      setActiveSegment(saved);
    } else {
      setActiveSegment("dashboard");
    }
  }, []);

  // Auto-select Uni Dashboard when services are loaded
  useEffect(() => {
    if (services.length > 0) {
      const uniDashboardService = services.find(s =>
        s.name.toLowerCase() === "uni dashboard" ||
        s.name.toLowerCase().includes("uni dashboard") ||
        s.name.toLowerCase() === "dashboard"
      );

      if (uniDashboardService) {
        // If current active segment is "dashboard" or doesn't match any service, set to uni dashboard
        // BUT: explicit check to allow "profile" and "logout" to persist
        if (activeSegment === "profile" || activeSegment === "logout") return;

        const currentService = services.find(s => s._id === activeSegment);
        // Only redirect if we are on the default "dashboard" placeholder or an invalid ID
        if (!currentService && activeSegment !== uniDashboardService._id) {
          // Double check if it's one of the hardcoded sidebar items
          const isHardcoded = ["profile", "logout"].includes(activeSegment);
          if (!isHardcoded) {
            setActiveSegment(uniDashboardService._id);
          }
        } else if (activeSegment === "dashboard") {
          setActiveSegment(uniDashboardService._id);
        }
      }
    }
  }, [services, activeSegment]);

  // Reset to Uni Dashboard when coming back from vendor page
  useEffect(() => {
    const fromVendor = searchParams.get('fromVendor');

    if (fromVendor === 'true' && services.length > 0) {
      const uniDashboardService = services.find(s =>
        s.name.toLowerCase() === "uni dashboard" ||
        s.name.toLowerCase().includes("uni dashboard") ||
        s.name.toLowerCase() === "dashboard"
      );

      if (uniDashboardService) {
        setActiveSegment(uniDashboardService._id);
        // Clean up the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('fromVendor');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [services, searchParams]);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
  }, [activeSegment]);

  // Load university identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        // Token is now in HTTP-only cookies
        /* REMOVED:
        const token = null;
        if (!token) {
          router.push("/uni-login");
          return;
        }
        */
        const userRes = await api.get("/api/uni/auth/user");
        if (userRes.status === 200) {
          const user = userRes.data;
          const uniId = user._id || user.id;
          setUniversityId(uniId);
          setUniversityName(user.fullName || "University");

          // Store uniId in localStorage
          localStorage.setItem("uniId", uniId);

          const assignRes = await api.get(`/api/university/universities/${uniId}/assignments`);
          const assignJson = assignRes.data;
          if (assignJson.success) {
            setServices(assignJson.data.services);
          }
        } else {
          // Failure to get user info, redirect only if we truly have no session
          const token = typeof window !== "undefined" ? null : null;
          if (!token) {
            router.push("/uni-login");
            return;
          }
        }
      } catch (e) {
        console.error("Failed to init uni dashboard", e);
        // Only redirect on explicit 401 (unauthorized); for other errors, stay on page
        if (axios.isAxiosError(e) && e.response?.status === 401) {
          const token = typeof window !== "undefined" ? null : null;
          if (!token) {
            router.push("/uni-login");
          }
        }
        return;
      }
    };
    init();
  }, [router]);

  const sidebarSegments = useMemo(() => {
    const serviceSegments = services.map((s) => ({ key: s._id, label: s.name, icon: <></> }));
    return [
      ...serviceSegments,
      { key: "profile", label: "Manage Profile", icon: <></> },
      { key: "logout", label: "Logout", icon: <></> },
    ];
  }, [services]);

  // Check for menu sorting params
  const menuSortingParam = searchParams.get("menuSorting");
  const vendorIdParam = searchParams.get("vendorId");

  return (
    <div className={styles.container}>
      <Sidebar
        active={activeSegment}
        onSegmentChange={setActiveSegment}
        universityName={universityName}
        universityId={universityId || "—"}
        segments={sidebarSegments}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <main className={styles.main}>
        {/* Mobile Header */}
        <div className={styles.mobileDashboardHeader}>
          <button className={styles.hamburgerBtn} onClick={() => setIsMobileMenuOpen(true)}>
            <AiOutlineMenu />
          </button>
          <span className={styles.mobileTitle}>{universityName}</span>
        </div>

        {/* Check if menu sorting is requested via URL params */}
        {menuSortingParam === "true" ? (
          <MenuSorting universityId={universityId || ""} vendorId={vendorIdParam || undefined} />
        ) : (
          (() => {
            if (activeSegment === "profile") {
              return (
                <div style={{ padding: '2rem' }}>
                  <UniProfile />
                </div>
              );
            }

            // Service-specific content mapping
            const currentService = services.find((s) => s._id === activeSegment);
            const name = currentService?.name?.toLowerCase() || "";
            if (!name) return null;
            if (name === "uni dashboard" || name.includes("uni dashboard") || name === "dashboard") {
              return <VendorManagement universityId={universityId || ""} />;
            }
            if (name === "add vendor" || name.includes("add vendor")) {
              return <AddVendorForm universityId={universityId || ""} />;
            }
            if (name === "add food item" || name.includes("add food item")) {
              return <UploadItemForm universityId={universityId || ""} />;
            }
            if (name === "manage items" || name.includes("manage items")) {
              return <ManageItems universityId={universityId || ""} />;
            }
            if (name === "manage charges" || name.includes("manage charges")) {
              return <ManageCharges universityId={universityId || ""} />;
            }
            if (name.includes("tax updating")) {
              return <TaxUpdating universityId={universityId || ""} />;
            }
            if (name === "invoice" || name.includes("invoice")) {
              return <Invoices universityId={universityId || ""} />;
            }
            if (name === "review" || name.includes("review")) {
              return <Review universityId={universityId || ""} />;
            }
            if (name.includes("grievances") || name.includes("grievance")) {
              return <UniGrievances universityId={universityId || ""} />;
            }
            if (name === "recipes" || name.includes("recipes")) {
              return <UniversityRecipes universityId={universityId || ""} />;
            }
            if (name === "menu sorting" || name.includes("menu sorting") || name.includes("menu sort")) {
              return <MenuSorting universityId={universityId || ""} />;
            }
            return null;
          })()
        )}

        {/* Add Vendor Segment */}
        {activeSegment === "add-vendor" && (
          <AddVendorForm universityId={universityId || ""} />
        )}

        {/* Upload Item Segment */}
        {activeSegment === "addItem" && (
          <UploadItemForm universityId={universityId || ""} />
        )}

        {/* Tax Updating Segment (fallback when using default segments) */}
        {activeSegment === "tax-updating" && (
          <TaxUpdating universityId={universityId || ""} />
        )}

        {/* Manage Items Segment */}
        {activeSegment === "manage-items" && (
          <ManageItems universityId={universityId || ""} />
        )}

        {/* Manage Charges Segment */}
        {activeSegment === "manage-charges" && (
          <ManageCharges universityId={universityId || ""} />
        )}

        {/* Recipes Segment */}
        {activeSegment === "recipes" && (
          <UniversityRecipes universityId={universityId || ""} />
        )}

      </main>
    </div>
  );
}