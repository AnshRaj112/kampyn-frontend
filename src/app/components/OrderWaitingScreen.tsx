// NEW FILE: Order waiting screen component - shows while waiting for vendor approval

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import styles from "./styles/OrderWaitingScreen.module.scss";

interface OrderWaitingScreenProps {
  orderId: string;
  userId: string;
  onOrderAccepted: () => void;
  onOrderDenied: (reason: string) => void;
  onOrderCancelled: () => void;
}

const OrderWaitingScreen: React.FC<OrderWaitingScreenProps> = ({
  orderId,
  userId,
  onOrderAccepted,
  onOrderDenied,
  onOrderCancelled,
}) => {
  const [waitTime, setWaitTime] = useState(0); // Wait time in seconds
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    
    // Start polling for order status
    const pollOrderStatus = async () => {
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
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onOrderAccepted();
          } else if (status === "denied") {
            // Order denied by vendor
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            onOrderDenied(response.data.denialReason || "Item not available");
          }
          // If still pendingVendorApproval, continue polling
        }
      } catch (error) {
        console.error("Error polling order status:", error);
      }
    };

    // Poll immediately, then every 3 seconds
    const intervalId = setInterval(pollOrderStatus, 3000);
    intervalRef.current = intervalId;
    pollOrderStatus();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orderId, onOrderAccepted, onOrderDenied]);

  const handleCancelOrder = async () => {
    if (isCancelling) return;
    
    setIsCancelling(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/order-approval/${orderId}/cancel`,
        { userId },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onOrderCancelled();
      } else {
        toast.error(response.data.message || "Failed to cancel order");
        setIsCancelling(false);
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to cancel order");
      } else {
        toast.error("Failed to cancel order");
      }
      setIsCancelling(false);
    }
  };

  const handleAddMoreItems = async () => {
    // Cancel the pending order so user can modify cart
    await handleCancelOrder();
  };

  const openCancelDialog = () => setShowCancelDialog(true);
  const closeCancelDialog = () => {
    if (!isCancelling) {
      setShowCancelDialog(false);
    }
  };

  const confirmCancelFromDialog = async () => {
    await handleCancelOrder();
    setShowCancelDialog(false);
  };

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
        
        <div className={styles.actionButtons}>
          <button
            className={styles.addMoreButton}
            onClick={handleAddMoreItems}
            disabled={isCancelling}
          >
            Add More Items
          </button>
          <button
            className={styles.cancelButton}
            onClick={openCancelDialog}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      </div>

      {showCancelDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialog}>
            <h3>Cancel this order?</h3>
            <p>
              Are you sure you want to cancel this order? You can always add more items and place a new one.
            </p>
            <div className={styles.dialogActions}>
              <button
                className={styles.dialogSecondary}
                onClick={closeCancelDialog}
                disabled={isCancelling}
              >
                Keep Waiting
              </button>
              <button
                className={styles.dialogPrimary}
                onClick={confirmCancelFromDialog}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderWaitingScreen;
