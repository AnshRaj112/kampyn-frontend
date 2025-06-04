"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaChevronDown } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./styles/Signup.module.scss";
// import GoogleSignup from "./GoogleSignup";

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
  const [formData, setFormData] = useState<SignupFormState>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    confirmPassword: "",
    uniID: "",
  });

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [colleges, setColleges] = useState<
    Array<{ _id: string; fullName: string }>
  >([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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
      const res = await fetch(`${BACKEND_URL}/api/user/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        notify("Signup successful!", "success");

        localStorage.setItem("token", data.token);

        setTimeout(() => {
          router.push(
            `/otpverification?email=${encodeURIComponent(
              formData.email
            )}&from=signup`
          );
        }, 2000);
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
      const res = await fetch(`${BACKEND_URL}/api/user/auth/refresh`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
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
  }, [BACKEND_URL, router]);

  // Refresh session on component mount
  useEffect(() => {
    checkSession(); // Refresh on page load

    const interval = setInterval(() => {
      checkSession();
    }, 60 * 60 * 1000); // Refresh every 1 hour

    return () => clearInterval(interval); // Cleanup on unmount
  }, [checkSession]);

  // Fetch colleges on component mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/user/auth/list`);
        if (res.ok) {
          const data = await res.json();
          setColleges(data);
        }
      } catch (error) {
        console.error("Error fetching colleges:", error);
        notify("Error loading colleges. Please try again.", "error");
      }
    };
    fetchColleges();
  }, [BACKEND_URL]);

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
      if (!formData.gender || !formData.uniID) {
        notify("Please select your gender and college.", "error");
        return;
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

  const handleCollegeSelection = (uniId: string) => {
    setFormData((prev) => ({ ...prev, uniID: uniId }));
    setShowCollegeDropdown(false);
  };

  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const collegeDropdownRef = useRef<HTMLDivElement>(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setShowGenderDropdown(false);
      }
      if (collegeDropdownRef.current && !collegeDropdownRef.current.contains(event.target as Node)) {
        setShowCollegeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1>Sign Up</h1>
        <form>
          {step === 1 && (
            <>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                type="text"
                placeholder="Full Name"
                required
              />
              <input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                placeholder="Email"
                required
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                type="tel"
                placeholder="Phone Number"
                pattern="[0-9]{10}"
                required
              />
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.passwordField}>
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
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
                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
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
                  {["Male", "Female"].map((genderOption) => (
                    <li
                      key={genderOption}
                      onClick={() => handleGenderSelection(genderOption)}
                    >
                      {genderOption}
                    </li>
                  ))}
                </ul>
              </div>

              {/* College Selection */}
              <div className={styles.collegeField} ref={collegeDropdownRef}>
                <input
                  name="college"
                  value={
                    colleges.find((c) => c._id === formData.uniID)?.fullName ||
                    ""
                  }
                  readOnly
                  placeholder="Select College"
                  onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
                />
                <FaChevronDown
                  className={`${styles.dropdownIcon} ${showCollegeDropdown ? styles.open : ''}`}
                />
                <ul className={`${styles.collegeList} ${showCollegeDropdown ? styles.show : ''}`}>
                  {colleges.map((college) => (
                    <li
                      key={college._id}
                      onClick={() => handleCollegeSelection(college._id)}
                    >
                      {college.fullName}
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
      <ToastContainer />
    </div>
  );
}
