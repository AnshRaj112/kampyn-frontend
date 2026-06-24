"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import api from "@/utils/apiUtils";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

interface RoleLoginFormProps {
  title: string;
  loginEndpoint: string;
  forgotPasswordPath: string;
  dashboardPath: string;
  highlightText: string;
  subtext: string;
  infoItems: string[];
  styles: Record<string, string>;
  transitionOverlay: React.ReactNode;
  /** Serializable alternative to a callback: applied on the client after a successful login. */
  postLoginLocalStorage?: ReadonlyArray<{ key: string; value: string }>;
  otpVerificationPath?: string;
}

const RoleLoginForm: React.FC<RoleLoginFormProps> = ({
  title,
  loginEndpoint,
  forgotPasswordPath,
  dashboardPath,
  highlightText,
  subtext,
  infoItems,
  styles,
  transitionOverlay,
  postLoginLocalStorage,
  otpVerificationPath,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post(loginEndpoint, formData);
      const data = response.data;

      if (response.status !== 200) {
        toast.error(data.message || "Login failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.tenantSlug) {
        localStorage.setItem("currentTenantSlug", data.tenantSlug);
      }

      window.dispatchEvent(new Event("authChanged"));
      postLoginLocalStorage?.forEach(({ key, value }) => {
        localStorage.setItem(key, value);
      });
      toast.success("Login successful!");
      setIsRedirecting(true);
      router.push(dashboardPath);
    } catch (error) {
      if (otpVerificationPath && axios.isAxiosError(error)) {
        const responseData = error.response?.data as { redirectTo?: string; email?: string; message?: string } | undefined;
        if (responseData?.redirectTo) {
          toast.info("Please verify your account");
          const email = responseData.email || formData.identifier.toLowerCase();
          router.push(`${otpVerificationPath}?email=${encodeURIComponent(email)}&from=login`);
          return;
        }
      }

      toast.error("Network error. Please try again.");
    } finally {
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Welcome Back</div>
        <div className={styles.box}>
          <h1>{title}</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier">Your email or phone</label>
              <input
                id="identifier"
                type="text"
                name="identifier"
                placeholder="Enter your email or phone"
                value={formData.identifier}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.passwordField}>
              <label htmlFor="password">Enter password</label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
            <div className={styles.forgotPassword}>
              <Link href={forgotPasswordPath}>Forgot Password?</Link>
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
              {!isLoading && <span className={styles.buttonArrow}>→</span>}
            </button>
          </form>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Welcome back</div>
          <h2 className={styles.heading}>
            Login to <span className={styles.highlight}>{highlightText}</span>
          </h2>
          <p className={styles.subtext}>{subtext}</p>
          <div className={styles.infoList}>
            {infoItems.map((item) => (
              <p key={item} className={styles.infoItem}>
                • {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <ToastContainer />
      {isRedirecting && transitionOverlay}
    </div>
  );
};

export default RoleLoginForm;
