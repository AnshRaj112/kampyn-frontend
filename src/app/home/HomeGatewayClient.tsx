"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import api from "@/utils/apiUtils";

type Feature = {
  _id?: string;
  name?: string;
};

type UniversityProfile = {
  fullName?: string;
  features?: Feature[];
};

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalize = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, " ").trim();

export default function HomeGatewayClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [uniId, setUniId] = useState<string>("");
  const [uniSlug, setUniSlug] = useState<string>("");
  const [featureNames, setFeatureNames] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const userResponse = await api.get("/api/user/auth/user");
        const user = userResponse.data;
        const resolvedUniId = user?.uniID || user?.college?._id;

        if (!resolvedUniId) {
          setFeatureNames([]);
          return;
        }

        setUniId(resolvedUniId);

        const profileResponse = await api.get(`/api/university/${resolvedUniId}/profile`);
        const profile = profileResponse.data as UniversityProfile;
        const fullName = profile?.fullName || "";
        setUniSlug(fullName ? toSlug(fullName) : "");
        setFeatureNames((profile?.features || []).map((f) => f?.name || "").filter(Boolean));
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    void init();
  }, [router]);

  const featureCards = useMemo(() => {
    const normalizedFeatures = featureNames.map(normalize);

    const hasFoodOrdering = normalizedFeatures.some(
      (name) => name.includes("food") && (name.includes("order") || name.includes("ordering"))
    );
    const hasGuestHouse = normalizedFeatures.some(
      (name) => name.includes("guest house") || name.includes("guesthouse")
    );

    const cards: Array<{ key: string; title: string; description: string; route: string }> = [];

    if (hasFoodOrdering) {
      cards.push({
        key: "food-ordering",
        title: "Food Ordering",
        description: "Browse campus vendors, discover dishes, and place your food order.",
        route: uniSlug && uniId ? `/food/${uniSlug}?cid=${uniId}` : "/food",
      });
    }

    if (hasGuestHouse) {
      cards.push({
        key: "guest-house",
        title: "Guest House Booking",
        description: "Book rooms and manage your guest house stay requests.",
        route: uniSlug && uniId ? `/guest-house-booking/${uniSlug}?cid=${uniId}` : "/guest-house-booking",
      });
    }

    return cards;
  }, [featureNames, uniId, uniSlug]);

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGradient}></div>
      <div className={styles.content}>
        <div className={styles.headerSection}>
          <h1 className={styles.heading}>Welcome to KAMPYN</h1>
          <p className={styles.subheading}>Select where you want to go</p>
        </div>

        {isLoading ? (
          <p className={styles.loadingText}>Loading your university features...</p>
        ) : featureCards.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No active features are assigned to your university yet.</p>
          </div>
        ) : (
          <div className={styles.optionsGrid}>
            {featureCards.map((card) => (
              <button
                key={card.key}
                type="button"
                className={styles.optionCard}
                data-theme-component="card.category"
                onClick={() => router.push(card.route)}
              >
                <h2 className={styles.cardTitle}>{card.title}</h2>
                <p className={styles.cardDescription}>{card.description}</p>
                <span className={styles.cta}>Open {card.title.toLowerCase()} →</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
