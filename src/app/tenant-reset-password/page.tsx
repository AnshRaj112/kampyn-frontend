import { Suspense } from "react";
import TenantResetPassword from "./ResetPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - Secure Your Tenant Studio Account",
  description: "Reset your tenant studio account password. Securely update your password to ensure the security of your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function TenantResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <TenantResetPassword />
    </Suspense>
  );
}
