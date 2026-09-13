 "use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./styles/Payment.module.scss";
import PageLoading from "../components/layout/PageLoading/PageLoading";

interface OrderItem {
  name: string;
  price: number;
  unit: string;
  type: string;
  quantity: number;
}

interface OrderDetails {
  _id: string;
  orderId: string;
  orderNumber: string;
  orderType: string;
  status: string;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  address?: string;
  total: number;
  vendorId: {
    _id: string;
    fullName: string;
    uniID?: string;
    college?: {
      _id: string;
      fullName: string;
    };
  };
  items: OrderItem[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [vendorPreparationTime, setVendorPreparationTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return null;
    }
    return null;
  };

  // Configure axios with auth header
  const getAuthConfig = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || orderId === 'undefined') {
        console.log("No valid orderId provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching order details for orderId:", orderId);
        
        // Fetch order details directly by orderId
        const orderResponse = await axios.get(
          `${BACKEND_URL}/order/${orderId}`,
          getAuthConfig()
        );

        console.log("Order response:", orderResponse.data);

        if (orderResponse.data.success && orderResponse.data.order) {
          setOrderDetails(orderResponse.data.order);
          
          // Fetch vendor delivery settings to get preparation time
          try {
            const vendorId = orderResponse.data.order.vendorId._id;
            const deliverySettingsResponse = await axios.get(
              `${BACKEND_URL}/api/vendor/${vendorId}/delivery-settings`
            );
            
            if (deliverySettingsResponse.data.success) {
              setVendorPreparationTime(deliverySettingsResponse.data.data.deliveryPreparationTime);
            }
          } catch (error) {
            console.error("Failed to fetch vendor preparation time:", error);
            // Set default preparation time if we can't fetch it
            setVendorPreparationTime(30);
          }
        } else {
          console.error("Order not found or invalid response");
          setError("Order not found or invalid response");
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        if (axios.isAxiosError(error)) {
          console.error("Error response:", error.response?.data);
          setError(error.response?.data?.message || "Failed to fetch order details");
        } else {
          setError("Failed to fetch order details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <PageLoading message="Loading your order details…" />;
  }

  if (!orderId || orderId === 'undefined') {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>Invalid Order</h1>
        <p className={styles.error}>No valid order ID provided. Please check your payment confirmation.</p>
        <button className={styles.button} onClick={() => router.push("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.heading}>Error</h1>
        <p className={styles.error}>{error}</p>
        <button className={styles.button} onClick={() => router.push("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Payment Successful!</h1>
      <p className={styles.message}>Thank you for your order.</p>
      
      {orderDetails && (
        <div className={styles.orderDetails}>
          <div className={styles.orderInfo}>
            <p className={styles.orderId}>
              <strong>Order ID:</strong> #{orderDetails.orderNumber}
            </p>
            <p className={styles.orderDate}>
              <strong>Order Date:</strong> {formatDate(orderDetails.createdAt)}
            </p>
            <p className={styles.orderType}>
              <strong>Order Type:</strong> {orderDetails.orderType.toUpperCase()}
            </p>
            <p className={styles.orderStatus}>
              <strong>Status:</strong> {orderDetails.status.toUpperCase()}
            </p>
          </div>

          {orderDetails.vendorId && (
            <div className={styles.vendorInfo}>
              <p className={styles.vendorName}>
                <strong>Vendor:</strong> {orderDetails.vendorId.fullName || "Unknown Vendor"}
              </p>
              {orderDetails.vendorId.college && (
                <p className={styles.collegeName}>
                  <strong>College:</strong> {orderDetails.vendorId.college.fullName || "Unknown College"}
                </p>
              )}
            </div>
          )}

          <div className={styles.collectorInfo}>
            <h3>Order Details</h3>
            <p><strong>Name:</strong> {orderDetails.collectorName}</p>
            <p><strong>Phone:</strong> {orderDetails.collectorPhone}</p>
            {orderDetails.address && (
              <p><strong>Address:</strong> {orderDetails.address}</p>
            )}
          </div>

          <div className={styles.itemsSection}>
            <h3>Items Ordered</h3>
            <div className={styles.itemsList}>
              {orderDetails.items.map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemName}>{item.name}</h4>
                    <p className={styles.itemDetails}>
                      ₹{item.price} per {item.unit} • {item.type}
                    </p>
                  </div>
                  <span className={styles.itemQuantity}>
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Preparation Time */}
          {vendorPreparationTime && (
            <div className={styles.preparationTime}>
              <h3>⏱️ Estimated Preparation Time</h3>
              <p className={styles.preparationTimeText}>
                Your order will be ready in approximately <strong>{vendorPreparationTime} minutes</strong>
              </p>
            </div>
          )}

          <div className={styles.orderTotal}>
            <p className={styles.totalAmount}>
              Total: ₹{orderDetails.total}
            </p>
          </div>
        </div>
      )}

      <button className={styles.button} onClick={() => router.push("/")}>
        Go to Home
      </button>
    </div>
  );
};

export default PaymentPage;
