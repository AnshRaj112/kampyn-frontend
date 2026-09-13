import {
  AiOutlineAppstore,
  AiOutlineClose,
  AiOutlineLogout,
  AiOutlineSetting,
} from "react-icons/ai";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";

interface Segment {
  key: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  active: string;
  onSegmentChange: (key: string) => void;
  universityName?: string;
  universityId?: string;
  segments?: Segment[];
  isOpen?: boolean;
  onClose?: () => void;
}

const iconForLabel = (label: string) => {
  const normalized = label.toLowerCase();
  if (normalized.includes("profile")) return <AiOutlineSetting />;
  if (normalized.includes("logout")) return <AiOutlineLogout />;
  return <AiOutlineAppstore />;
};

export default function Sidebar({
  active,
  onSegmentChange,
  universityName = "—",
  universityId = "—",
  segments = [],
  isOpen = false,
  onClose,
}: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post("/api/uni/auth/logout");
    } catch {
      // Ignore logout API errors and continue client-side cleanup.
    } finally {
      void 0;
      localStorage.removeItem("uniId");
      router.push("/uni-login");
    }
  };

  const handleSegmentClick = (key: string) => {
    if (key === "logout") {
      void handleLogout();
    } else {
      onSegmentChange(key);
    }
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r bg-white shadow-lg transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-4 md:hidden">
          <p className="text-sm font-semibold text-slate-900">Menu</p>
          <button onClick={onClose} className="rounded border p-1.5 text-slate-600" aria-label="Close menu">
            <AiOutlineClose />
          </button>
        </div>

        <div className="h-full overflow-y-auto px-3 py-4">
          <ul className="space-y-2">
            {segments.map((segment) => (
              <li key={segment.key}>
                <button
                  onClick={() => handleSegmentClick(segment.key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${
                    active === segment.key
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{segment.icon || iconForLabel(segment.label)}</span>
                  <span className="truncate">{segment.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">{universityName}</p>
            <p className="mt-1 break-all">ID: {universityId}</p>
          </div>
        </div>
      </aside>
    </>
  );
}

