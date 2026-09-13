"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import dynamic from "next/dynamic";
import styles from "../vendor-login/styles/vendorLogin.module.scss";
import api from "@/utils/apiUtils";

const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function GuestHouseLoginPage() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/api/guest-house/auth/login", formData);
      if (response.status === 200) {
        localStorage.setItem("guestHouseRole", "manager");
        window.dispatchEvent(new Event("authChanged"));
        toast.success("Login successful!");
        router.push("/guest-house-dashboard");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; email?: string } } };
      const message = err.response?.data?.message || "Login failed";
      if (message.includes("not verified")) {
        const email = err.response?.data?.email || formData.identifier;
        router.push(`/guest-house-otp-verification?email=${encodeURIComponent(email)}&from=login`);
        return;
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Welcome Back</div>
        <div className={styles.box}>
          <h1>Guest House Login</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">Email or contact number</label>
              <input
                id="identifier"
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData((prev) => ({ ...prev, identifier: e.target.value }))}
                required
              />
            </div>
            <div className={styles.passwordField}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className={styles.forgotPassword}>
              <Link href="/guest-house-forgot-password">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
        <div className={styles.infoPanel}>
          <div className={styles.badge}>Guest House Portal</div>
          <h2 className={styles.heading}>
            Access <span className={styles.highlight}>your property panel</span>
          </h2>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

