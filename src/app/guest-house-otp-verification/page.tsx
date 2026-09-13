"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../vendor-otp-verification/styles/vendorOtpVerification.module.scss";
import api from "@/utils/apiUtils";

function GuestHouseOtpContent() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.toLowerCase();
  const fromPage = searchParams.get("from");

  useEffect(() => {
    if (!email) router.push("/guest-house-login");
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) return toast.error("Please enter a 6-digit OTP.");
    setLoading(true);
    try {
      const response = await api.post("/api/guest-house/auth/otpverification", { email, otp: otpString });
      if (response.status === 200) {
        localStorage.setItem("guestHouseRole", "manager");
        window.dispatchEvent(new Event("authChanged"));
        toast.success("OTP verified successfully!");
        if (fromPage === "forgotpassword") {
          router.push(`/guest-house-reset-password?email=${encodeURIComponent(email || "")}`);
        } else {
          router.push("/guest-house-login");
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email || countdown > 0) return;
    try {
      await api.post("/api/guest-house/auth/resendotp", { email });
      setCountdown(60);
      toast.success("OTP resent successfully");
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Verify identity</div>
        <div className={styles.box}>
          <h1>OTP Verification</h1>
          <p className={styles.subtext}>Enter the OTP sent to {email}</p>
          <form onSubmit={verifyOtp}>
            <div className={styles.otpContainer}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  className={styles.otpInput}
                />
              ))}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
          <button type="button" className={styles.resendButton} onClick={resendOtp} disabled={countdown > 0}>
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function GuestHouseOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GuestHouseOtpContent />
    </Suspense>
  );
}

