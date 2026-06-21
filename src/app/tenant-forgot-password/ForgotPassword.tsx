"use client";

import styles from "./styles/ForgotPassword.module.scss";
import RoleForgotPasswordForm from "@/app/components/auth/RoleForgotPasswordForm";

export default function TenantForgotPassword() {
  return (
    <RoleForgotPasswordForm
      styles={styles}
      forgotApiPath="/api/tenant/auth/forgotpassword"
      otpPagePath="/tenant-otp-verification"
      bannerText="Reset tenant studio password"
      labelText="Tenant studio email or phone"
      infoHeadingHighlight="your tenant studio"
      infoItems={["Secure password recovery", "Instant OTP verification", "Fast dashboard access"]}
    />
  );
}
