// components/Sidebar.tsx
import {
  AiOutlineDashboard,
  AiOutlineAppstore,
  AiOutlineApple,
  AiOutlineFileText,
  AiOutlineLogout,
  AiOutlineHistory,
  AiOutlineCar,
  AiOutlineShoppingCart,
  AiOutlineTruck,
  AiOutlineFileZip,
  AiOutlineBook,
} from "react-icons/ai";
import { useRouter } from "next/navigation";
import React from "react";
import styles from "../styles/SideBar.module.scss";

const allSegments = [
  { key: "dashboard", label: "Dashboard", icon: <AiOutlineDashboard />, featureKey: "dashboard" },
  { key: "active-orders", label: "Active Order", icon: <AiOutlineAppstore />, featureKey: "active_order" },
  {
    key: "retail-inventory",
    label: "Retail Inventory",
    icon: <AiOutlineAppstore />,
    featureKey: "retail_inventory",
  },
  {
    key: "produce-inventory",
    label: "Produce Inventory",
    icon: <AiOutlineApple />,
    featureKey: "produce_inventory",
  },
  {
    key: "inventory-reports",
    label: "Inventory Report",
    icon: <AiOutlineFileText />,
    featureKey: "inventory_report",
  },
  {
    key: "recipes",
    label: "Recipes",
    icon: <AiOutlineBook />,
    featureKey: "recipes",
  },
  {
    key: "delivery-orders",
    label: "Delivery Order",
    icon: <AiOutlineCar />,
    featureKey: "delivery_order",
  },
  {
    key: "past-orders",
    label: "Past Order",
    icon: <AiOutlineHistory />,
    featureKey: "past_order",
  },
  {
    key: "invoices",
    label: "Invoice",
    icon: <AiOutlineFileZip />,
    featureKey: "invoice",
  },
  {
    key: "vendor-cart",
    label: "Vendor Cart",
    icon: <AiOutlineShoppingCart />,
    featureKey: "vendor_cart",
  },
  {
    key: "delivery-settings",
    label: "Delivery Settings",
    icon: <AiOutlineTruck />,
    featureKey: "delivery_settings",
  },
  { key: "logout", label: "Logout", icon: <AiOutlineLogout />, featureKey: null }, // Always visible
];


interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  vendorName?: string;
  vendorId?: string;
  segments?: { key: string; label: string; icon: React.ReactNode; featureKey?: string }[];
}

export default function Sidebar({
  active,
  onSegmentChange,
  vendorName = "—",
  vendorId = "—",
  segments,
}: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = React.useState<Record<string, boolean> | null>(null);

  // Use provided segments or fallback to allSegments
  const segmentsToUse = segments || allSegments;

  React.useEffect(() => {
    const fetchAccess = async () => {
      try {
        const uniId = localStorage.getItem('uniId') || '';
        const role = localStorage.getItem('vendorRole') || undefined; // 'seller' | 'nonSeller'
        const params = new URLSearchParams({ uniId });
        if (vendorId && vendorId !== '—') params.set('vendorId', vendorId);
        if (role) params.set('role', role);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/api/access/features?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const json = await res.json();
        const features = json.features || {};
        
        // Create a map of service names to check if they're available
        const serviceMap: Record<string, boolean> = {};
        Object.values(features as Record<string, { enabled: boolean; services?: Array<{ name: string }> }>).forEach((feature) => {
          if (feature.enabled && feature.services) {
            feature.services.forEach((service: { name: string }) => {
              // Map service names to lowercase with underscores for matching
              const serviceKey = service.name.toLowerCase().replace(/\s+/g, '_');
              serviceMap[serviceKey] = true;
            });
          }
        });
        
        const allowedMap: Record<string, boolean> = {};
        
        segmentsToUse.forEach((seg) => {
          if (seg.featureKey) {
            // Extract service name from featureKey (e.g., "service.food_ordering.dashboard" -> "dashboard")
            const serviceName = seg.featureKey.split('.').pop() || '';
            allowedMap[seg.key] = !!serviceMap[serviceName];
          } else {
            allowedMap[seg.key] = true; // Always allow logout and segments without featureKey
          }
        });
        
        setAllowed(allowedMap);
      } catch (e) {
        console.error('Failed to fetch access', e);
        // If access check fails, allow all segments (fallback behavior)
        const fallbackMap: Record<string, boolean> = {};
        segmentsToUse.forEach((seg) => {
          fallbackMap[seg.key] = true;
        });
        setAllowed(fallbackMap);
      }
    };
    fetchAccess();
  }, [vendorId, segmentsToUse]);

  const handleSegmentClick = (key: string) => {
    if (key === "logout") {
      handleLogout();
    } else {
      onSegmentChange(key);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Optional: Notify backend to invalidate the session
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        await fetch(`${backendUrl}/api/vendor/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear token and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("vendorRole");
      localStorage.removeItem("uniId");
      router.push("/vendor-login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if backend call fails
      localStorage.removeItem("token");
      localStorage.removeItem("vendorRole");
      localStorage.removeItem("uniId");
      router.push("/vendor-login");
    }
  };

  // Filter segments based on allowed features
  const visibleSegments = allowed ? segmentsToUse.filter(seg => allowed[seg.key]) : segmentsToUse;

  return (
    <aside className={styles.sidebar}>
      <ul className={styles.menu}>
        {visibleSegments.map((s) => (
          <li
            key={s.key}
            className={active === s.key ? styles.active : ""}
            onClick={() => handleSegmentClick(s.key)}
            data-segment={s.key}
          >
            <span className={styles.icon}>{s.icon}</span>
            <span className={styles.label}>{s.label}</span>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <span className={styles.vendorName}>{vendorName}</span>
        <br />
        <span className={styles.vendorId}>ID: {vendorId}</span>
      </div>
    </aside>
  );
}
