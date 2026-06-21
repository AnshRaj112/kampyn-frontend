import { Suspense } from "react";
import TenantOtpVerificationClient from "./OtpVerification";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OTP Verification - Secure Your Tenant Studio Account",
  description: "Verify your tenant studio account with a secure OTP. Complete the verification process to ensure the security of your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function TenantOtpVerification() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <TenantOtpVerificationClient />
    </Suspense>
  );
}
