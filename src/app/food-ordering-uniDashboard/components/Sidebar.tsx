import {
  AiOutlineDashboard,
  AiOutlineShopping,
  AiOutlineFileText,
  AiOutlinePlusCircle,
  AiOutlineDollar,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineBook,
  AiOutlineClose,
} from "react-icons/ai";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";
import styles from "../styles/SideBar.module.scss";

const defaultSegments = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <AiOutlineDashboard />
  },
  {
    key: "add-vendor",
    label: "Add Vendor",
    icon: <AiOutlineShopping />,
  },
  {
    key: "addItem",
    label: "Add Food Item",
    icon: <AiOutlinePlusCircle />,
  },
  {
    key: "manage-items",
    label: "Manage Items",
    icon: <AiOutlineFileText />,
  },
  {
    key: "recipes",
    label: "Recipes",
    icon: <AiOutlineBook />,
  },
  {
    key: "manage-charges",
    label: "Manage Charges",
    icon: <AiOutlineDollar />,
  },
  {
    key: "tax-updating",
    label: "Tax Updating — Food Ordering",
    icon: <AiOutlineSetting />,
  },
  // Note: dynamic services loaded from assignments will include Review/Invoice/DeleteVendorList etc.
  { key: "logout", label: "Logout", icon: <AiOutlineLogout /> },
];

interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  universityName?: string;
  universityId?: string;
  segments?: { key: string; label: string; icon: React.ReactNode }[];
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  active,
  onSegmentChange,
  universityName = "—",
  universityId = "—",
  segments,
  isOpen = false,
  onClose,
}: Props) {
  const router = useRouter();

  const handleSegmentClick = (key: string) => {
    if (key === "logout") {
      handleLogout();
    } else {
      onSegmentChange(key);
    }
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      const token = null;
      if (token) {
        // Optional: Notify backend to invalidate the session
        await api.post("/api/uni/auth/logout");
      }

      // Clear token and redirect
      void 0;
      router.push("/uni-login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if backend call fails
      void 0;
      router.push("/uni-login");
    }
  };

  return (
    <>
      <div
        className={`${styles.sidebarOverlay} ${isOpen ? styles.open : ""}`}
        onClick={onClose}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.mobileHeader}>
          <button className={styles.closeBtn} onClick={onClose}>
            <AiOutlineClose />
          </button>
        </div>
        <ul className={styles.menu}>
          {(segments || defaultSegments).map((s) => (
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
          <span className={styles.universityName}>{universityName}</span>
          <br />
          <span className={styles.universityId}>ID: {universityId}</span>
        </div>
      </aside>
    </>
  );
}
