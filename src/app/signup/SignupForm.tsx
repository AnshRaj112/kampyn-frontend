"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaChevronDown } from "react-icons/fa";
import dynamic from "next/dynamic";
import styles from "./styles/Signup.module.scss";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import api from "@/utils/apiUtils";
import { useTenant } from "@/app/components/context/TenantContext";

// Lazy load ToastContainer to reduce initial bundle size
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

// Import toast function separately (lightweight)
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface SignupFormState {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  password: string;
  confirmPassword: string;
  uniID: string;
}

export default function SignupForm() {
  // Redirect if user is already authenticated
  useAuthRedirect();

  const [formData, setFormData] = useState<SignupFormState>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: "",
    uniID: "",
  });

  const { tenant } = useTenant();
  const router = useRouter();

  useEffect(() => {
    if (tenant?._id) {
      setFormData((prev) => ({ ...prev, uniID: tenant._id }));
    }
  }, [tenant]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) =>
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[@$!%*?&]/.test(password) &&
    !/\s/.test(password);

  const notify = (message: string, type: "success" | "error") => {
    toast[type](message, { position: "bottom-right", autoClose: 3000 });
  };

  const fetchUser = async () => {
    if (!BACKEND_URL) {
      notify("Server configuration error. Please contact support.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post("/api/user/auth/signup", formData);

      const data = res.data;
      if (res.status === 200 || res.status === 201) {
        // Token will be provided after OTP verification, not during signup
        // Navigate immediately to OTP verification page
        router.push(
          `/otpverification?email=${encodeURIComponent(
            formData.email
          )}&from=signup`
        );

        // Show success notification (non-blocking)
        notify(data.message || "OTP sent! Please verify your email.", "success");
      } else {
        notify(data.message || "Signup failed. Try again.", "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
      notify("Network error. Please try again later.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = useCallback(async () => {
    try {
      const res = await api.get("/api/user/auth/refresh");

      if (res.status === 200) {
        console.log("✅ Session refreshed successfully");
      } else if (res.status === 401 || res.status === 403) {
        console.log("🔴 Session expired, redirecting ...");
        localStorage.removeItem("token"); // Clear stored token (if any)
        router.push("/signup"); // Redirect to login page
      } else {
        console.log("⚠️ Unexpected response from server");
      }
    } catch (error) {
      console.error("❌ Error refreshing session:", error);
    }
  }, [router]);

  // Refresh session on component mount - deferred to not block initial render
  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Defer session check to after initial render (keeps logic identical, just timing)
    const timeoutId = setTimeout(() => {
      checkSession(); // Refresh on page load
    }, 0);

    const interval = setInterval(() => {
      checkSession();
    }, 60 * 60 * 1000); // Refresh every 1 hour

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval); // Cleanup on unmount
    };
  }, [checkSession]);

  // // Fetch colleges on component mount - deferred to not block initial render
  // useEffect(() => {
  //   // Defer college fetch to after initial render (keeps logic identical, just timing)
  //   const timeoutId = setTimeout(() => {
  //     const fetchColleges = async () => {
  //       try {
  //         const res = await api.get("/api/user/auth/list");
  //         if (res.status === 200) {
  //           const data = res.data;
  //           setColleges(data);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching colleges:", error);
  //         notify("Error loading colleges. Please try again.", "error");
  //       }
  //     };
  //     fetchColleges();
  //   }, 100); // Small delay to allow UI to render first

  //   return () => clearTimeout(timeoutId);
  // }, []);

  console.log("Making request to:", `${BACKEND_URL}/api/user/auth/signup`);
  console.log("Request body:", formData);

  const handleNext = () => {
    if (step === 1) {
      if (
        !formData.fullName ||
        !validateEmail(formData.email) ||
        formData.phone.length !== 10
      ) {
        notify(
          "Please enter a valid name, email, and 10-digit phone number.",
          "error"
        );
        return;
      }
    } else if (step === 2) {
      if (
        !validatePassword(formData.password) ||
        formData.password !== formData.confirmPassword
      ) {
        notify(
          "Password must be at least 8 characters long, contain uppercase, lowercase, a number, and a special character.",
          "error"
        );
        return;
      }
    } else if (step === 3) {
      const activeUniID = formData.uniID || tenant?._id;
      if (!formData.gender || !activeUniID) {
        notify("Please select your gender.", "error");
        return;
      }
      if (!formData.uniID && activeUniID) {
        setFormData((prev) => ({ ...prev, uniID: activeUniID }));
      }
    }

    if (step < 3) {
      setStep((prevStep) => prevStep + 1);
    } else {
      fetchUser();
    }
  };

  const handleBack = () => {
    setStep((prevStep) => Math.max(1, prevStep - 1));
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
      }));
    },
    []
  );

  const handleGenderSelection = (gender: string) => {
    setFormData((prev) => ({ ...prev, gender }));
    setShowGenderDropdown(false);
  };

  // const handleCollegeSelection = (uniId: string) => {
  //   setFormData((prev) => ({ ...prev, uniID: uniId }));
  //   setShowCollegeDropdown(false);
  // };

  const genderDropdownRef = useRef<HTMLDivElement>(null);
  // const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // // Add click outside handler
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
  //       setShowGenderDropdown(false);
  //     }
  //     if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
  //       setShowCollegeDropdown(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.msg}>Create your account</div>
        <div className={styles.box}>
          <h1>Sign Up</h1>
          <form>
            {step === 1 && (
              <>
                <div className={styles.fieldGroup}>
                  <label htmlFor="fullName">Your name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="email">Your email</label>
                  <input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label htmlFor="phone">Your phone</label>
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    type="tel"
                    placeholder="Enter your phone number"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.passwordField}>
                  <label htmlFor="password">Enter password</label>
                  <input
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>

                <div className={styles.passwordField}>
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {/* Gender Selection */}
                <div className={styles.genderField} ref={genderDropdownRef}>
                  <input
                    name="gender"
                    value={formData.gender}
                    readOnly
                    placeholder="Gender"
                    onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                  />
                  <FaChevronDown
                    className={`${styles.dropdownIcon} ${showGenderDropdown ? styles.open : ''}`}
                  />
                  <ul className={`${styles.genderList} ${showGenderDropdown ? styles.show : ''}`}>
                    {["Male", "Female", "Others"].map((genderOption) => (
                      <li
                        key={genderOption}
                        onClick={() => handleGenderSelection(genderOption)}
                      >
                        {genderOption}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div className={step === 1 ? styles.buttons : styles.buttonsSpaced}>
              {step > 1 && (
                <button
                  type="button"
                  className={styles.stepButton}
                  onClick={handleBack}
                >
                  <span className={styles.buttonArrow}>←</span>
                  Back
                </button>
              )}
              <button
                type="button"
                className={styles.stepButton}
                onClick={handleNext}
                disabled={isLoading}
              >
                {isLoading ? "Signing up..." : step === 3 ? "Submit" : "Next"}
                {!isLoading && step !== 3 && <span className={styles.buttonArrow}>→</span>}
                {!isLoading && step === 3 && <span className={styles.buttonArrow}>✈</span>}
              </button>
            </div>

            {step === 1 && (
              <>
                {/* <div className={styles.divider}>
                <span> OR </span>{" "}
              </div>
              <div className={styles.googleSignUp}>
                <GoogleSignup />
              </div> */}

                <p className={styles.alreadyAccount}>
                  Already have an account?{" "}
                  <a href="/login" className={styles.loginLink}>
                    Login
                  </a>
                </p>
              </>
            )}
          </form>
        </div>

        <div className={styles.infoPanel}>
          <div className={styles.badge}>Create your account</div>
          <h2 className={styles.heading}>
            Join the{" "}
            <span className={styles.highlight}>KAMPYN campus network</span>
          </h2>
          <p className={styles.subtext}>
            One account to discover nearby vendors, unlock campus-only offers,
            and keep every order just a tap away.
          </p>
          <div className={styles.infoList}>
            <p className={styles.infoItem}>• Explore food across your campus</p>
            <p className={styles.infoItem}>
              • Save your college and personalise your feed
            </p>
            <p className={styles.infoItem}>• Track orders in real time</p>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
