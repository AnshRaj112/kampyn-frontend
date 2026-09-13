"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import api from "@/utils/apiUtils";

interface RoleOtpVerificationFormProps {
  styles: Record<string, string>;
  verifyApiPath: string;
  resendApiPath: string;
  forgotPasswordResendUsesIdentifier?: boolean;
  forgotRedirectPath: string;
  dashboardRedirectPath: string;
  loginPath?: string;
  authRoleForUserFetch?: string;
  storeUserFromApi?: boolean;
  saveVendorRole?: boolean;
  successMessage?: string;
}

export default function RoleOtpVerificationForm({
  styles,
  verifyApiPath,
  resendApiPath,
  forgotPasswordResendUsesIdentifier = false,
  forgotRedirectPath,
  dashboardRedirectPath,
  loginPath,
  authRoleForUserFetch,
  storeUserFromApi = false,
  saveVendorRole = false,
  successMessage = "OTP verified successfully!",
}: RoleOtpVerificationFormProps) {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email")?.toLowerCase() || "";
  const fromPage = searchParams.get("from");

  useEffect(() => {
    if (!email && loginPath) {
      router.push(loginPath);
    }
  }, [email, loginPath, router]);

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
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text").slice(0, 6);
    if (!/^\d{6}$/.test(pastedData)) return;
    const next = pastedData.split("");
    setOtp(next);
    next.forEach((num, idx) => {
      if (inputRefs.current[idx]) {
        inputRefs.current[idx]!.value = num;
      }
    });
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (!otpString || otpString.length !== 6) {
      toast.error("Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(verifyApiPath, { email, otp: otpString });
      const data = response.data;

      if (response.status !== 200) {
        toast.error(data?.message || "OTP verification failed");
        return;
      }

      window.dispatchEvent(new Event("authChanged"));
      if (saveVendorRole) {
        localStorage.setItem("vendorRole", "seller");
      }

      if (fromPage === "forgotpassword" || fromPage === "/forgotpassword") {
        toast.success(successMessage);
        router.push(`${forgotRedirectPath}?email=${encodeURIComponent(email)}`);
        return;
      }

      if (storeUserFromApi && authRoleForUserFetch) {
        const userRes = await api.get(`/api/${authRoleForUserFetch}/auth/user`);
        if (userRes.status === 200) {
          localStorage.setItem("user", JSON.stringify(userRes.data));
        }
      }

      toast.success(successMessage);
      router.push(dashboardRedirectPath);
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !email) return;
    setResendLoading(true);
    try {
      const payload = forgotPasswordResendUsesIdentifier ? { identifier: email } : { email };
      const response = await api.post(resendApiPath, payload);
      const data = response.data;

      if (response.status === 200) {
        setCountdown(60);
        toast.success("OTP resent successfully!");
      } else {
        toast.error(data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email && loginPath) return null;

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Verify your identity</div>
        <div className={styles.box}>
          <h1>OTP Verification</h1>
          <p className={styles.subtext}>Enter the OTP sent to {email}</p>
          <form onSubmit={handleSubmit}>
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
                  onPaste={handlePaste}
                  className={styles.otpInput}
                  required
                  aria-label={`OTP Digit ${index + 1}`}
                  title={`OTP Digit ${index + 1}`}
                  placeholder=" "
                />
              ))}
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
          <div className={styles.footer}>
            {styles.resendButton ? (
              <>
                <p>Didn&apos;t receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading || countdown > 0}
                  className={styles.resendButton}
                >
                  {resendLoading ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </>
            ) : (
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!resendLoading && countdown === 0) {
                    handleResendOtp();
                  }
                }}
                style={{
                  pointerEvents: resendLoading || countdown > 0 ? "none" : "auto",
                  opacity: resendLoading || countdown > 0 ? 0.6 : 1,
                }}
              >
                Didn&apos;t receive the code?{" "}
                {resendLoading ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </Link>
            )}
            {loginPath && styles.backLink && (
              <p className={styles.backLink}>
                <a href={loginPath}>Back to Login</a>
              </p>
            )}
          </div>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Verify your identity</div>
          <h2 className={styles.heading}>
            Secure <span className={styles.highlight}>verification</span>
          </h2>
          <p className={styles.subtext}>
            We&apos;ve sent a 6-digit code to your registered email. Enter it below to verify your identity and
            continue.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Check your email inbox</p>
            <p className={styles.infoItem}>• Code expires in 10 minutes</p>
            <p className={styles.infoItem}>• Can resend if needed</p>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
