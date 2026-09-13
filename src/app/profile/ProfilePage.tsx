"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/apiUtils";
import {
  User,
  Mail,
  // Bell,
  HandPlatter,
  ShoppingCart,
  Book,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info,
} from "lucide-react";
import styles from "./styles/UserProfile.module.scss";
import { useRouter } from "next/navigation";
import Link from "next/link";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // Handled by apiUtils

const UserProfile = () => {
  const router = useRouter();
  const [user, setUser] = useState<{
    fullName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isGuestHouseBookingsOpen, setIsGuestHouseBookingsOpen] = useState(true);
  const [ghBookings, setGhBookings] = useState<
    Array<{
      bookingId: string;
      guestHouseName?: string;
      guestHouseLocation?: string;
      roomTypeName?: string;
      checkInDate: string;
      checkOutDate: string;
      lifecycleStatus: string;
      assignedRoomNumbers: string;
      totalPrice: number;
    }>
  >([]);
  const [loadingGhBookings, setLoadingGhBookings] = useState(false);

  // ✅ Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/user/auth/user");
        setUser(res.data);
        const phone = String(res.data?.phone || "").trim();
        if (phone) {
          try {
            setLoadingGhBookings(true);
            const b = await api.get("/api/guest-house-bookings/public/bookings-by-contact", {
              params: { guestPhone: phone },
            });
            setGhBookings(Array.isArray(b.data?.data) ? b.data.data : []);
          } catch {
            setGhBookings([]);
          } finally {
            setLoadingGhBookings(false);
          }
        }
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          router.push("/login"); // If unauthorized, redirect to login
        } else {
          console.error("Error fetching user:", error);
        }
      }
    };

    fetchUser();
  }, [router]);

  // ✅ Handle Logout
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    setIsLoggingOut(true);

    try {
      const response = await api.post("/api/user/auth/logout");

      if (response.status === 200) {
        void 0; // Cleanup legacy token if present
        setTimeout(() => router.push("/login"), 1000);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error("Logout failed:", response.data);
        setIsLoggingOut(false);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error("Logout failed:", err.response?.data || err.message);
      setIsLoggingOut(false);
    }
  };

  const togglePersonalInfo = () => {
    setIsPersonalInfoOpen(!isPersonalInfoOpen);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <h1 className={styles.header}>Profile</h1>

        {/* Personal Info Section */}
        <div className={styles.section}>
          <div className={styles.dropdownHeader} onClick={togglePersonalInfo}>
            <User className={styles.iconBlue} size={20} />
            <span>Personal Info</span>
            {isPersonalInfoOpen ? (
              <ChevronUp className={styles.chevron} size={16} />
            ) : (
              <ChevronDown className={styles.chevron} size={16} />
            )}
          </div>

          <div
            className={`${styles.dropdownContent} ${isPersonalInfoOpen ? styles.open : ""
              }`}
          >
            <div className={styles.infoItem}>
              <strong>Full Name:</strong> {user?.fullName || "Loading..."}
            </div>
            <div className={styles.infoItem}>
              <strong>Email Address:</strong> {user?.email || "Loading..."}
            </div>
            <div className={styles.infoItem}>
              <strong>Phone Number:</strong> +91 {user?.phone || "Loading..."}
            </div>
          </div>
        </div>

        {/* Guest house bookings section */}
        <div className={styles.section}>
          <div
            className={styles.dropdownHeader}
            onClick={() => setIsGuestHouseBookingsOpen((prev) => !prev)}
          >
            <Book className={styles.iconPurple} size={20} />
            <span>Guest House Bookings</span>
            {isGuestHouseBookingsOpen ? (
              <ChevronUp className={styles.chevron} size={16} />
            ) : (
              <ChevronDown className={styles.chevron} size={16} />
            )}
          </div>
          <div className={`${styles.dropdownContent} ${isGuestHouseBookingsOpen ? styles.open : ""}`}>
            {loadingGhBookings ? (
              <div className={styles.infoItem}>Loading guest house bookings...</div>
            ) : ghBookings.length === 0 ? (
              <div className={styles.infoItem}>No guest house bookings found for your phone.</div>
            ) : (
              ghBookings.slice(0, 10).map((b) => (
                <div key={b.bookingId} className={styles.infoItem}>
                  <strong>{b.guestHouseName || "Guest House"}</strong> — {b.roomTypeName || "Room"} —{" "}
                  {new Date(b.checkInDate).toLocaleDateString()} to {new Date(b.checkOutDate).toLocaleDateString()}
                  <div className={styles.infoItem}>
                    <strong>Status:</strong> {b.lifecycleStatus} | <strong>Room:</strong>{" "}
                    {b.assignedRoomNumbers || "Not assigned yet"} | <strong>Paid:</strong> ₹{Number(b.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
            <div className={styles.infoItem}>
              <strong>Tip:</strong> To order in-room food or raise service requests, open the Guest House booking page from your university portal and use your booking id + phone lookup.
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className={styles.section}>
          <Link href="/cart" className={styles.menuItem}>
            <ShoppingCart className={styles.iconGreen} size={20} />
            <span>Cart</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>

          <Link href="/pastorders" className={styles.menuItem}>
            <Book className={styles.iconPurple} size={20} />
            <span>Previous Orders</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>

          <Link href="/activeorders" className={styles.menuItem}>
            <HandPlatter className={styles.iconPurple} size={20} />
            <span>Active Orders</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>

          <Link href="/fav" className={styles.menuItem}>
            <User className={styles.iconOrange} size={20} />
            <span>Favourites</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>

          {/* Will be added later */}
          {/* <Link href="/notifications" className={styles.menuItem}>
            <Bell className={styles.iconBlue} size={20} />
            <span>Notifications</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link> */}
        </div>

        {/* Support Section */}
        <div className={styles.section}>
          <Link href="/termncondition" className={styles.menuItem}>
            <HelpCircle className={styles.iconTeal} size={20} />
            <span>Terms & Conditions</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>

          <Link href="/about" className={styles.menuItem}>
            <Info className={styles.iconIndigo} size={20} />
            <span>About Us</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>

          <Link href="/contact" className={styles.menuItem}>
            <Mail className={styles.iconPink} size={20} />
            <span>Contact Us</span>
            <ChevronRight className={styles.chevron} size={16} />
          </Link>
        </div>

        {/* Logout Section */}
        <div className={styles.section}>
          <div
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={handleLogout}
            style={{ cursor: isLoggingOut ? "not-allowed" : "pointer" }}
          >
            <LogOut className={styles.iconRed} size={20} />
            <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
