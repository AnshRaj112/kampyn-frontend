"use client";

import styles from "./styles/OtpVerification.module.scss";
import RoleOtpVerificationForm from "@/app/components/auth/RoleOtpVerificationForm";

export default function TenantOtpVerificationClient() {
  return (
    <RoleOtpVerificationForm
      styles={styles}
      verifyApiPath="/api/tenant/auth/otpverification"
      resendApiPath="/api/tenant/auth/resendotp"
      forgotRedirectPath="/tenant-reset-password"
      dashboardRedirectPath="/tenant-studio"
      loginPath="/tenant-login"
      successMessage="Account verified successfully!"
    />
  );
}
