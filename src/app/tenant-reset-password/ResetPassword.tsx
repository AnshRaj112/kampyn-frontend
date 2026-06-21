"use client";

import styles from "./styles/ResetPassword.module.scss";
import RoleResetPasswordForm from "@/app/components/auth/RoleResetPasswordForm";

export default function TenantResetPassword() {
  return (
    <RoleResetPasswordForm
      styles={styles}
      resetApiPath="/api/tenant/auth/resetpassword"
      loginPath="/tenant-login"
    />
  );
}
