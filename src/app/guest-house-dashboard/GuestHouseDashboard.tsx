"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/apiUtils";
import GuestHouseBookingsPanel from "./GuestHouseBookingsPanel";
import PhysicalRoomsEditor from "@/app/guest-house-booking-unidashboard/components/PhysicalRoomsEditor";
import AmenitiesLaundryTracker from "./AmenitiesLaundryTracker";
import YieldRulesManager from "./YieldRulesManager";
import GuestServiceDeskPanel from "./GuestServiceDeskPanel";
import InRoomFoodManagerPanel from "./InRoomFoodManagerPanel";

type Service = {
  _id: string;
  name: string;
  feature?: { _id: string; name: string };
};

type Segment = {
  key: string;
  label: string;
};

const normalize = (value: string) => (value || "").toLowerCase().trim();

export default function GuestHouseDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState("dashboard");
  const [guestHouseName, setGuestHouseName] = useState("Guest House");
  const [guestHouseId, setGuestHouseId] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSettings, setProfileSettings] = useState({
    inRoomFoodEnabled: false,
    inRoomFoodMenuNote: "",
    allowServiceRequests: true,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const assignmentRes = await api.get("/api/guest-house/auth/assignments");
        const assignmentData = assignmentRes.data?.data;

        if (!assignmentData?.guestHouseId) {
          router.push("/guest-house-login");
          return;
        }

        setGuestHouseId(assignmentData.guestHouseId);
        setGuestHouseName(assignmentData.guestHouseName || "Guest House");
        setServices(Array.isArray(assignmentData.services) ? assignmentData.services : []);
        try {
          const settingsRes = await api.get("/api/guest-house-bookings/manager/profile-settings");
          const settings = settingsRes.data?.data?.guestExperienceSettings || {};
          setProfileSettings({
            inRoomFoodEnabled: settings.inRoomFoodEnabled === true,
            inRoomFoodMenuNote: settings.inRoomFoodMenuNote || "",
            allowServiceRequests: settings.allowServiceRequests !== false,
          });
        } catch {
          // keep defaults
        }
      } catch {
        router.push("/guest-house-login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const segments = useMemo<Segment[]>(() => {
    const serviceSegments = services
      .filter((service) => normalize(service.name) !== "dashboard")
      .map((service) => ({
        key: service._id,
        label: service.name,
      }));

    return [
      { key: "dashboard", label: "Dashboard" },
      { key: "amenities-laundry", label: "Amenities & Laundry" },
      { key: "yield-rules", label: "Dynamic Pricing" },
      { key: "service-desk", label: "Service Desk" },
      { key: "in-room-food", label: "In-room Food" },
      { key: "profile", label: "Profile" },
      ...serviceSegments,
      { key: "logout", label: "Logout" },
    ];
  }, [services]);

  const handleLogout = async () => {
    try {
      await api.post("/api/guest-house/auth/logout");
    } catch {
      // Best effort logout; local cleanup still runs.
    } finally {
      void 0;
      localStorage.removeItem("guestHouseRole");
      window.dispatchEvent(new Event("authChanged"));
      router.push("/guest-house-login");
    }
  };

  const renderMainContent = () => {
    if (activeSegment === "dashboard") {
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Guest House Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {guestHouseName}. Review every booking, guest contact details, and assign room numbers for your guests.
            </p>
          </div>
          <GuestHouseBookingsPanel />
        </div>
      );
    }

    if (activeSegment === "room-map") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Room map & CRM</h1>
            <p className="text-gray-600">
              Configure floors, room slots, housekeeping status, and notes for {guestHouseName}. Bookings stay under Dashboard.
            </p>
          </div>
          <PhysicalRoomsEditor guestHouseId={guestHouseId} />
        </div>
      );
    }

    if (activeSegment === "profile") {
      return (
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p><span className="font-semibold">Guest House:</span> {guestHouseName}</p>
            <p><span className="font-semibold">Guest House ID:</span> {guestHouseId}</p>
            <div className="mt-4 space-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={profileSettings.inRoomFoodEnabled}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, inRoomFoodEnabled: e.target.checked }))
                  }
                />
                Enable in-room food ordering
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={profileSettings.allowServiceRequests}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, allowServiceRequests: e.target.checked }))
                  }
                />
                Allow guest service requests
              </label>
              <div>
                <p className="mb-1 text-xs text-gray-600">In-room food note/menu info</p>
                <input
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={profileSettings.inRoomFoodMenuNote}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, inRoomFoodMenuNote: e.target.value }))
                  }
                  placeholder="e.g. Order till 10:30 PM via reception"
                />
              </div>
              <button
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
                disabled={profileSaving}
                onClick={async () => {
                  try {
                    setProfileSaving(true);
                    await api.patch("/api/guest-house-bookings/manager/profile-settings", profileSettings);
                  } finally {
                    setProfileSaving(false);
                  }
                }}
              >
                {profileSaving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeSegment === "amenities-laundry") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Amenities & Laundry</h1>
            <p className="text-gray-600">
              Track daily room-wise toiletries, bedsheets, blankets and other amenity movement.
            </p>
          </div>
          <AmenitiesLaundryTracker />
        </div>
      );
    }

    if (activeSegment === "yield-rules") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Dynamic Pricing & Blackout</h1>
            <p className="text-gray-600">
              Manage date-range price overrides and blackout windows for each room type.
            </p>
          </div>
          <YieldRulesManager />
        </div>
      );
    }

    if (activeSegment === "service-desk") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Guest Service Desk</h1>
            <p className="text-gray-600">
              Handle guest support tickets, assign actions, and resolve service requests.
            </p>
          </div>
          <GuestServiceDeskPanel />
        </div>
      );
    }

    if (activeSegment === "in-room-food") {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">In-room Food Catalog & Orders</h1>
            <p className="text-gray-600">
              Manage menu items and fulfill in-room food orders. Guests can order only when enabled in Profile settings.
            </p>
          </div>
          <InRoomFoodManagerPanel />
        </div>
      );
    }

    const currentService = services.find((service) => service._id === activeSegment);
    if (!currentService) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Service not found.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{currentService.name}</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-gray-700">
            This section is enabled for your account by admin service assignment.
          </p>
          {currentService.feature?.name ? (
            <p className="mt-2 text-sm text-gray-500">Feature: {currentService.feature.name}</p>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-72 border-r border-gray-200 bg-white p-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-gray-500">Guest House</p>
          <p className="text-lg font-semibold text-gray-800">{guestHouseName}</p>
        </div>

        <nav className="space-y-2">
          {segments.map((segment) => (
            <button
              key={segment.key}
              onClick={() => {
                if (segment.key === "logout") {
                  handleLogout();
                  return;
                }
                setActiveSegment(segment.key);
              }}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                activeSegment === segment.key
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {segment.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500">
            Loading dashboard...
          </div>
        ) : (
          renderMainContent()
        )}
      </main>
    </div>
  );
}

