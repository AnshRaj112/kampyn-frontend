import { UniTransitionOverlay } from '../components/shared/Skeleton/UniTransitionOverlay';
import RoleLoginForm from '../components/auth/RoleLoginForm';
import styles from "./styles/login.module.scss";

export default function TenantLoginPage() {
  return (
    <RoleLoginForm
      title="Tenant Studio Login"
      loginEndpoint="/api/tenant/auth/login"
      forgotPasswordPath="/tenant-forgot-password"
      dashboardPath="/tenant-studio"
      highlightText="your tenant studio"
      subtext="Access your college customizations, manage branding assets, configure active widgets, and run deployment promotions."
      infoItems={[
        "Customize branding themes",
        "Toggle dashboard widgets",
        "Promote configuration environments",
      ]}
      styles={styles}
      transitionOverlay={<UniTransitionOverlay />}
      otpVerificationPath="/tenant-otp-verification"
    />
  );
}
