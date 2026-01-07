"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";

import Invoices from "./components/VendorInvoices";
import { RetailInventory } from "./components/RetailInventory";
import { ProduceInventory } from "./components/ProduceInventory";
import { RawMaterialInventory } from "./components/RawMaterialInventory";
import { InventoryTransfer } from "./components/InventoryTransfer";
import VendorDashboard from "./components/VendorDashboard";
import { OrderList } from "./components/OrderList";
import { PastOrdersList } from "./components/PastOrdersList";
import { DeliveryOrdersList } from "./components/DeliveryOrdersList";
import { VendorCartComponent } from "./components/VendorCart";
// NEW: Import pending order requests component for vendor to accept/deny orders (new file)
import { PendingOrderRequests } from "./components/PendingOrderRequests";
import { DeliverySettings } from "./components/DeliverySettings";
import VendorInvoices from "./components/VendorInvoices";
import VendorGrievances from "./components/VendorGrievances";
import VendorRecipes from "./components/VendorRecipes";
import RecipeWorks from "./components/RecipeWorks";
import StatCard from "./components/StatCard";
import InventoryTable from "./components/InventoryTable";
import DateFilter from "./components/DateFilter";
import DownloadButton from "./components/DownloadButton";
import { Order, InventoryReport, transformApiReport } from "./types";
import styles from "./styles/InventoryReport.module.scss";
import { ENV_CONFIG } from "@/config/environment";

type PendingOrderAlert = {
  orderId: string;
  orderNumber: string;
  collectorName: string;
  orderType: string;
  total: number;
  createdAt: string;
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>("Vendor");
  const [services, setServices] = useState<{ _id: string; name: string; feature: { _id: string; name: string } }[]>([]);
  const [activeSegment, setActiveSegment] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);

  // Inventory Reports state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [appliedDate, setAppliedDate] = useState(selectedDate);
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  // State for managing order transitions between components
  const [orderStatusChanges, setOrderStatusChanges] = useState<{
    orderId: string;
    newStatus: string;
    orderData?: Order;
  }[]>([]);
  const [pendingOrderAlert, setPendingOrderAlert] = useState<PendingOrderAlert | null>(null);
  const [notificationStreamAttempt, setNotificationStreamAttempt] = useState(0);
  const notificationRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOrderPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAlertedOrderIdRef = useRef<string | null>(null);
  const activeSegmentRef = useRef<string>(activeSegment);
  const servicesRef = useRef<{ _id: string; name: string; feature: { _id: string; name: string } }[]>(services);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }),
    []
  );

  // Function to handle order status changes
  const handleOrderStatusChange = (orderId: string, newStatus: string, orderData?: Order) => {
    console.log(`Dashboard: Order status change - ID: ${orderId}, Status: ${newStatus}, Type: ${orderData?.orderType}`);
    setOrderStatusChanges(prev => [...prev, { orderId, newStatus, orderData }]);
    
    // Clear the change after a short delay to prevent memory leaks
    setTimeout(() => {
      setOrderStatusChanges(prev => prev.filter(change => change.orderId !== orderId));
    }, 5000);
  };

  useEffect(() => {
    // Always land on dashboard for this page
    localStorage.removeItem("activeSegment");
    setActiveSegment("dashboard");
     
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSegment", activeSegment);
    activeSegmentRef.current = activeSegment;
  }, [activeSegment]);

  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  useEffect(() => {
    return () => {
      if (notificationRetryRef.current) {
        clearTimeout(notificationRetryRef.current);
      }
      if (pendingOrderPollRef.current) {
        clearInterval(pendingOrderPollRef.current);
      }
    };
  }, []);

  // Load vendor identity and assignments
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/vendor-login");
          return;
        }

        // Get vendor user info
        const userRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/vendor/auth/user`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (userRes.ok) {
          const user = await userRes.json();
          const vendorIdFromUser = user._id || user.id;
          setVendorId(vendorIdFromUser);
          setVendorName(user.fullName || "Vendor");

          // Store uniID in localStorage
          if (user.uniID) {
            localStorage.setItem("uniId", user.uniID);
          }

          // Get vendor assignments (services)
          const assignRes = await fetch(`${ENV_CONFIG.BACKEND.URL}/api/vendor/${vendorIdFromUser}/assignments`);
          const assignJson = await assignRes.json();
          
          if (assignJson.success) {
            setServices(assignJson.data.services);
          }
        } else {
          // Token is invalid or expired, redirect to login
          localStorage.removeItem("token");
          router.push("/vendor-login");
          return;
        }
      } catch (e) {
        console.error("Failed to init vendor dashboard", e);
        // On error, remove token and redirect to login
        localStorage.removeItem("token");
        router.push("/vendor-login");
        return;
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!vendorId) return;
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const streamUrl = new URL(`${ENV_CONFIG.BACKEND.URL}/api/vendor/notifications/stream`);
    streamUrl.searchParams.set("token", token);

    const eventSource = new EventSource(streamUrl.toString(), { withCredentials: true });

    eventSource.addEventListener("pending-order", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.orderId && data.orderId === lastAlertedOrderIdRef.current) {
          return;
        }
        // Don't show notification if we're already on the pending orders section
        const currentActiveSegment = activeSegmentRef.current;
        const currentServices = servicesRef.current;
        const currentService = currentServices.find((s) => s._id === currentActiveSegment);
        const name = currentService?.name?.toLowerCase() || "";
        const isOnPendingOrders = currentActiveSegment === "pending-orders" || 
          name.includes("pending order") || name.includes("pending orders");
        
        if (isOnPendingOrders) {
          return;
        }
        
        lastAlertedOrderIdRef.current = data.orderId || null;
        setPendingOrderAlert({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          collectorName: data.collectorName,
          orderType: data.orderType,
          total: data.total,
          createdAt: data.createdAt,
        });
      } catch (err) {
        console.error("Failed to parse pending order notification", err);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      if (notificationRetryRef.current) {
        clearTimeout(notificationRetryRef.current);
      }
      notificationRetryRef.current = setTimeout(() => {
        setNotificationStreamAttempt((prev) => prev + 1);
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [vendorId, notificationStreamAttempt]);

  useEffect(() => {
    if (!vendorId) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const fetchLatestPendingOrder = async () => {
      try {
        const response = await fetch(`${ENV_CONFIG.BACKEND.URL}/order-approval/pending/${vendorId}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data?.success && Array.isArray(data.orders) && data.orders.length > 0) {
          const latest = data.orders[0];
          if (latest?.orderId && latest.orderId !== lastAlertedOrderIdRef.current) {
            // Don't show notification if we're already on the pending orders section
            const currentActiveSegment = activeSegmentRef.current;
            const currentServices = servicesRef.current;
            const currentService = currentServices.find((s) => s._id === currentActiveSegment);
            const name = currentService?.name?.toLowerCase() || "";
            const isOnPendingOrders = currentActiveSegment === "pending-orders" || 
              name.includes("pending order") || name.includes("pending orders");
            
            if (!isOnPendingOrders) {
              lastAlertedOrderIdRef.current = latest.orderId;
              setPendingOrderAlert({
                orderId: latest.orderId,
                orderNumber: latest.orderNumber,
                collectorName: latest.collectorName,
                orderType: latest.orderType,
                total: latest.total,
                createdAt: latest.createdAt,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to poll pending orders", err);
      }
    };

    fetchLatestPendingOrder();

    if (pendingOrderPollRef.current) {
      clearInterval(pendingOrderPollRef.current);
    }
    pendingOrderPollRef.current = setInterval(fetchLatestPendingOrder, 15000);

    return () => {
      if (pendingOrderPollRef.current) {
        clearInterval(pendingOrderPollRef.current);
        pendingOrderPollRef.current = null;
      }
    };
  }, [vendorId]);

  const sidebarSegments = useMemo(() => {
    // Filter out any service named "Dashboard" to avoid duplicates
    const filteredServices = services.filter(s => s.name.toLowerCase() !== "dashboard");
    const hasPendingOrdersService = filteredServices.some(
      (s) => s.name?.toLowerCase().includes("pending order")
    );
    
    const serviceSegments = filteredServices.map((s) => ({ 
      key: s._id, 
      label: s.name, 
      icon: <></>,
      featureKey: `service.${s.feature.name.toLowerCase().replace(/\s+/g, '_')}.${s.name.toLowerCase().replace(/\s+/g, '_')}`
    }));
    
    const baseSegments = [
      { key: "dashboard", label: "Dashboard", icon: <></>, featureKey: "service.dashboard" },
    ];

    if (!hasPendingOrdersService) {
      baseSegments.push({
        key: "pending-orders",
        label: "Pending Orders",
        icon: <></>,
        featureKey: "service.pending_orders",
      });
    }

    return [
      ...baseSegments,
      ...serviceSegments,
      { key: "logout", label: "Logout", icon: <></> },
    ];
  }, [services]);

  const pendingOrdersSegmentId = useMemo(() => {
    const pendingService = services.find((s) => s.name?.toLowerCase().includes("pending order"));
    return pendingService?._id ?? null;
  }, [services]);

  // Check if we're currently on the pending orders section
  const isPendingOrdersSectionActive = useMemo(() => {
    if (activeSegment === "pending-orders") return true;
    const currentService = services.find((s) => s._id === activeSegment);
    const name = currentService?.name?.toLowerCase() || "";
    return name.includes("pending order") || name.includes("pending orders");
  }, [activeSegment, services]);

  // Common onLoaded handler for components to update sidebar
  const handleOnLoaded = (vendorName: string, vendorId: string) => {
    setVendorName(vendorName);
    setVendorId(vendorId);
  };

  const navigateToPendingOrders = () => {
    const targetSegment = pendingOrdersSegmentId || "pending-orders";
    setActiveSegment(targetSegment);
    setPendingOrderAlert(null);
  };

  const dismissPendingOrderAlert = () => setPendingOrderAlert(null);

  // Fetch inventory report
  const fetchReport = useCallback(async (date: string) => {
    if (!vendorId) return;
    
    setLoadingReport(true);
    setErrorReport(null);
    try {
      const url = `${ENV_CONFIG.BACKEND.URL}/inventoryreport/vendor/${vendorId}?date=${date}`;
      console.log("🔍 Fetching inventory report from:", url);
      
      const res = await fetch(url);
      const json = await res.json();
      
      console.log("📊 API Response:", json);
      
      if (!json.success) {
        console.log("❌ API response success is false:", json);
        setReport(null);
        setErrorReport("No report found for the selected date.");
        return;
      }
      
      console.log("✅ API response success is true, transforming data:", json.data);
      const transformedReport = transformApiReport(json.data);
      console.log("📋 Transformed report:", transformedReport);
      
      setReport(transformedReport);
    } catch (err: unknown) {
      console.error("❌ Fetch error:", err);
      setErrorReport(err instanceof Error ? err.message : "Unknown error");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  }, [vendorId]);

  const applyFilter = () => {
    setAppliedDate(selectedDate);
  };

  const renderPendingOrderRequests = () => (
    <>
      <div className={styles.header}>
        <h1>Pending Order Requests</h1>
        <p>Review and respond to new order requests from customers</p>
      </div>
      {vendorId ? (
        <PendingOrderRequests
          vendorId={vendorId || ""}
          onOrderProcessed={() => {
            console.log("Pending order processed");
          }}
        />
      ) : (
        <div className="p-4 text-sm text-gray-500">Loading vendor information…</div>
      )}
    </>
  );

  // Determine if Inventory Reports is the active view (either fixed key or service by name)
  const isInventoryReportsActive = useMemo(() => {
    if (activeSegment === "inventory-reports") return true;
    const currentService = services.find((s) => s._id === activeSegment);
    const name = currentService?.name?.toLowerCase() || "";
    return name === "inventory report" || name.includes("inventory report");
  }, [activeSegment, services]);

  // Fetch report when Inventory Reports view is active or when appliedDate changes
  useEffect(() => {
    if (isInventoryReportsActive && vendorId) {
      fetchReport(appliedDate);
    }
  }, [appliedDate, isInventoryReportsActive, vendorId, fetchReport]);

  // Auto-dismiss notification when visiting pending orders section
  useEffect(() => {
    if (isPendingOrdersSectionActive && pendingOrderAlert) {
      setPendingOrderAlert(null);
    }
  }, [isPendingOrdersSectionActive, pendingOrderAlert]);

  return (
    <div className={styles.container}>
      <Sidebar
        active={activeSegment}
        onSegmentChange={setActiveSegment}
        vendorName={vendorName}
        vendorId={vendorId || "—"}
        segments={sidebarSegments}
      />

      <main className={styles.main}>
        {pendingOrderAlert && !isPendingOrdersSectionActive && (
          <div className={styles.notificationBanner}>
            <div className={styles.notificationContent}>
              <p className={styles.notificationTitle}>New pending order</p>
              <div className={styles.notificationMessage}>
                <span className={styles.orderLabel}>Order</span>
                <span className={styles.orderNumber}>#{pendingOrderAlert.orderNumber}</span>
                <span className={styles.customerName}>from {pendingOrderAlert.collectorName}</span>
              </div>
              <p className={styles.notificationMeta}>
                {new Date(pendingOrderAlert.createdAt).toLocaleTimeString()} ·{" "}
                {currencyFormatter.format(pendingOrderAlert.total || 0)}
              </p>
            </div>
            <div className={styles.notificationActions}>
              <button className={styles.viewButton} onClick={navigateToPendingOrders}>
                View pending orders
              </button>
              <button className={styles.dismissButton} onClick={dismissPendingOrderAlert}>
                Dismiss
              </button>
            </div>
          </div>
        )}
        {loading && (
          <div className="p-4 text-sm text-gray-500">Loading your services…</div>
        )}

        {/* Service-specific content mapping */}
        {(() => {
          const currentService = services.find((s) => s._id === activeSegment);
          const name = currentService?.name?.toLowerCase() || "";
          
          if (activeSegment === "dashboard") {
            return <VendorDashboard vendorName={vendorName} vendorId={vendorId || ""} />;
          }
          
          // Handle inventory-reports segment
          if (activeSegment === "inventory-reports") {
            return (
              <>
                <div className={styles.header}>
                  <h1>Inventory Reports</h1>
                  <p>View and export detailed inventory reports</p>
                </div>
                <div className={styles.topBar}>
                  <div className={styles.stats}>
                    {report ? (
                      <>
                        <StatCard
                          label="Total Items Tracked"
                          value={report.stats.totalTracked}
                        />
                        <StatCard
                          label="Produced Today"
                          value={report.stats.producedToday}
                        />
                        <StatCard
                          label="Received Today"
                          value={report.stats.receivedToday}
                        />
                        <StatCard
                          label="Sold Today"
                          value={report.stats.soldToday}
                          positive
                        />
                        <StatCard
                          label="Sent Today"
                          value={report.stats.sentToday}
                        />
                      </>
                    ) : (
                      <div>Loading stats…</div>
                    )}
                  </div>
                  <div className={styles.controls}>
                    <DateFilter
                      date={selectedDate}
                      onChange={setSelectedDate}
                      onFilter={applyFilter}
                    />
                    {report && (
                      <DownloadButton
                        vendorName={report.vendorName}
                        reportDate={report.reportDate}
                        stats={report.stats}
                        items={report.items}
                        receivedFrom={report.receivedFrom}
                        sent={report.sent}
                        sentTo={report.sentTo}
                      />
                    )}
                  </div>
                </div>
                {loadingReport ? (
                  <p>Loading report…</p>
                ) : errorReport ? (
                  <p className={styles.error}>{errorReport}</p>
                ) : report ? (
                  <InventoryTable
                    items={report.items ?? []}
                    date={report.reportDate}
                    sent={report.sent}
                    sentTo={report.sentTo}
                  />
                ) : (
                  <p>No report data available.</p>
                )}
              </>
            );
          }

          if (activeSegment === "pending-orders") {
            return renderPendingOrderRequests();
          }
          
          if (!name) return null;
          
          if (name === "invoice" || name.includes("invoice")) {
            return <Invoices vendorId={vendorId || ""} />;
          }
          if (name === "inventory report" || name.includes("inventory report")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Inventory Reports</h1>
                  <p>View and export detailed inventory reports</p>
                </div>
                <div className={styles.topBar}>
                  <div className={styles.stats}>
                    {report ? (
                      <>
                        <StatCard
                          label="Total Items Tracked"
                          value={report.stats.totalTracked}
                        />
                        <StatCard
                          label="Produced Today"
                          value={report.stats.producedToday}
                        />
                        <StatCard
                          label="Received Today"
                          value={report.stats.receivedToday}
                        />
                        <StatCard
                          label="Sold Today"
                          value={report.stats.soldToday}
                          positive
                        />
                        <StatCard
                          label="Sent Today"
                          value={report.stats.sentToday}
                        />
                      </>
                    ) : (
                      <div>Loading stats…</div>
                    )}
                  </div>
                  <div className={styles.controls}>
                    <DateFilter
                      date={selectedDate}
                      onChange={setSelectedDate}
                      onFilter={applyFilter}
                    />
                    {report && (
                      <DownloadButton
                        vendorName={report.vendorName}
                        reportDate={report.reportDate}
                        stats={report.stats}
                        items={report.items}
                        receivedFrom={report.receivedFrom}
                        sent={report.sent}
                        sentTo={report.sentTo}
                      />
                    )}
                  </div>
                </div>
                {loadingReport ? (
                  <p>Loading report…</p>
                ) : errorReport ? (
                  <p className={styles.error}>{errorReport}</p>
                ) : report ? (
                  <InventoryTable
                    items={report.items ?? []}
                    date={report.reportDate}
                    sent={report.sent}
                    sentTo={report.sentTo}
                  />
                ) : (
                  <p>No report data available.</p>
                )}
              </>
            );
          }
          if (name === "retail inventory" || name.includes("retail inventory")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Retail Inventory</h1>
                  <p>Manage your packaged items</p>
                </div>
                <RetailInventory vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          if (name === "produce inventory" || name.includes("produce inventory")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Produce Inventory</h1>
                  <p>Manage your fresh produce items</p>
                </div>
                <ProduceInventory vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          if (name === "raw materials" || name.includes("raw materials") || name === "raw inventory") {
            return (
              <>
                <div className={styles.header}>
                  <h1>Raw Materials Inventory</h1>
                  <p>Manage your raw material items with opening and closing amounts</p>
                </div>
                <RawMaterialInventory vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          if (name === "inventory transfer" || name.includes("inventory transfer")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Inventory Transfer</h1>
                  <p>Send and receive inventory from other vendors</p>
                </div>
                <InventoryTransfer vendorId={vendorId || ""} />
              </>
            );
          }
          if (name === "pending orders" || name.includes("pending orders") || name === "pending order" || name.includes("pending order")) {
            return renderPendingOrderRequests();
          }
          if (name === "active orders" || name.includes("active orders") || name === "active order" || name.includes("active order")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Active Orders</h1>
                  <p>Manage your incoming orders in real-time</p>
                </div>
                <OrderList 
                  vendorId={vendorId || ""}
                  onLoaded={handleOnLoaded} 
                  onOrderStatusChange={handleOrderStatusChange}
                  orderStatusChanges={orderStatusChanges}
                />
              </>
            );
          }
          if (name === "delivery orders" || name.includes("delivery orders") || name === "delivery order" || name.includes("delivery order")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Delivery Orders</h1>
                  <p>Manage orders that are out for delivery</p>
                </div>
                <DeliveryOrdersList 
                  vendorId={vendorId || ""}
                  onLoaded={handleOnLoaded} 
                  onOrderStatusChange={handleOrderStatusChange}
                  orderStatusChanges={orderStatusChanges}
                />
              </>
            );
          }
          if (name === "past orders" || name.includes("past orders") || name === "past order" || name.includes("past order")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Past Orders</h1>
                  <p>View and manage past orders</p>
                </div>
                <PastOrdersList vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          if (name === "vendor cart" || name.includes("vendor cart")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Vendor Cart</h1>
                  <p>Create orders for customers directly</p>
                </div>
                <VendorCartComponent vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          if (name === "delivery settings" || name.includes("delivery settings")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Delivery Settings</h1>
                  <p>Configure your delivery preferences and availability</p>
                </div>
                <DeliverySettings vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          if (name === "invoices" || name.includes("invoices")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Invoices</h1>
                  <p>View and download your invoices</p>
                </div>
                <VendorInvoices vendorId={vendorId || ""} />
              </>
            );
          }
          if (name.includes("grievances") || name.includes("grievance")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Grievances</h1>
                  <p>Submit and track your grievances</p>
                </div>
                <VendorGrievances vendorId={vendorId || ""} />
              </>
            );
          }
          if (name === "recipes" || name.includes("recipes")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Recipe Management</h1>
                  <p>Create and manage your recipes</p>
                </div>
                <VendorRecipes vendorId={vendorId || ""} />
              </>
            );
          }
          if (name === "recipe works" || name.includes("recipe works")) {
            return (
              <>
                <RecipeWorks />
              </>
            );
          }
          if (name === "delivery-settings" || name.includes("delivery settings")) {
            return (
              <>
                <div className={styles.header}>
                  <h1>Delivery Settings</h1>
                  <p>Configure your delivery preferences and availability</p>
                </div>
                <DeliverySettings vendorId={vendorId || ""} onLoaded={handleOnLoaded} />
              </>
            );
          }
          
          return null;
        })()}
      
      </main>
    </div>
  );
}
