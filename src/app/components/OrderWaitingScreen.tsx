// NEW FILE: Order waiting screen component - shows while waiting for vendor approval

import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./styles/OrderWaitingScreen.module.scss";

interface OrderWaitingScreenProps {
  orderId: string;
  onOrderAccepted: () => void;
  onOrderDenied: (reason: string) => void;
}

const OrderWaitingScreen: React.FC<OrderWaitingScreenProps> = ({
  orderId,
  onOrderAccepted,
  onOrderDenied,
}) => {
  const [waitTime, setWaitTime] = useState(0); // Wait time in seconds

  useEffect(() => {
    const startTime = Date.now();
    
    // Start polling for order status
    const pollOrderStatus = async (intervalId: NodeJS.Timeout) => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-approval/status/${orderId}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          const status = response.data.status;

          // Update wait time
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setWaitTime(elapsed);

          // Check if order was accepted or denied
          if (status === "inProgress") {
            // Order accepted by vendor
            clearInterval(intervalId);
            onOrderAccepted();
          } else if (status === "denied") {
            // Order denied by vendor
            clearInterval(intervalId);
            onOrderDenied(response.data.denialReason || "Item not available");
          }
          // If still pendingVendorApproval, continue polling
        }
      } catch (error) {
        console.error("Error polling order status:", error);
      }
    };

    // Poll immediately, then every 3 seconds
    const intervalId = setInterval(() => pollOrderStatus(intervalId), 3000);
    pollOrderStatus(intervalId);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [orderId, onOrderAccepted, onOrderDenied]);

  const formatWaitTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.spinner}>
          <div className={styles.spinnerCircle}></div>
        </div>
        <h2 className={styles.title}>Waiting for Vendor Approval</h2>
        <p className={styles.message}>
          Your order is being reviewed by the vendor. Please wait...
        </p>
        <div className={styles.waitTime}>
          <span className={styles.waitTimeLabel}>Wait Time:</span>
          <span className={styles.waitTimeValue}>{formatWaitTime(waitTime)}</span>
        </div>
        <div className={styles.statusIndicator}>
          <div className={styles.statusDot}></div>
          <span className={styles.statusText}>Order pending approval</span>
        </div>
      </div>
    </div>
  );
};

export default OrderWaitingScreen;

