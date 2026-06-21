import TenantForgotPassword from "./ForgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your Tenant Studio Account",
  description: "Reset your tenant studio account password securely. Follow our simple steps to regain access to your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function TenantForgotPasswordPage() {
  return (
    <div>
      <TenantForgotPassword />
    </div>
  );
}
