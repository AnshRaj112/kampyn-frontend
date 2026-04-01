"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, AlertCircle, RefreshCw, MapPin } from "lucide-react";
import styles from "./styles/Home.module.scss";
import { useEffect, useState } from "react";
import api from "@/utils/apiUtils";

interface College {
  fullName: string;
  slug?: string;
  _id: string;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const HomePage = () => {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get("/api/user/auth/list");
        if (response.status !== 200) {
          throw new Error("Failed to fetch colleges");
        }
        const data = response.data;
        const collegesWithSlugs = data.map((college: College) => ({
          ...college,
          slug: generateSlug(college.fullName),
        }));
        setColleges(collegesWithSlugs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  const handleCollegeClick = (college: College) => {
    localStorage.setItem("currentCollegeId", college._id);
    router.push(`/home/${college.slug}`);
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorState}>
            <div className={styles.errorIconWrapper}>
              <AlertCircle size={40} />
            </div>
            <h1 className={styles.errorHeading}>Something went wrong</h1>
            <p className={styles.errorMessage}>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Decorative grid lines */}
      <div className={styles.gridOverlay} aria-hidden="true" />

      <div className={styles.content}>
        {/* Hero Section */}
        <header className={styles.hero}>
          <div className={styles.eyebrow}>
            <MapPin size={14} />
            <span>Campus Food Network</span>
          </div>
          <h1 className={styles.heading}>
            Discover Your
            <span className={styles.headingAccent}> Campus.</span>
          </h1>
          <p className={styles.subtitle}>
            Select your college to explore restaurants, menus, and place your order in seconds.
          </p>
          <div className={styles.heroDivider} aria-hidden="true" />
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar} aria-label="Platform stats">
          <div className={styles.statItem}>
            <span className={styles.statNumber}>
              {loading ? "—" : colleges.length}
            </span>
            <span className={styles.statLabel}>Campuses</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>50+</span>
            <span className={styles.statLabel}>Vendors</span>
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.statItem}>
            <span className={styles.statNumber}>10k+</span>
            <span className={styles.statLabel}>Orders Served</span>
          </div>
        </div>

        {/* College Grid */}
        <section aria-label="Select your campus">
          {loading ? (
            <div className={styles.collegeGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className={styles.skeletonInner} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.collegeGrid}>
              {colleges
                .filter((c) => c.slug)
                .map((college, index) => (
                  <button
                    key={college._id}
                    className={styles.collegeCard}
                    onClick={() => handleCollegeClick(college)}
                    style={{ animationDelay: `${index * 0.07}s` }}
                    aria-label={`Go to ${college.fullName}`}
                  >
                    <div className={styles.cardTopBar} aria-hidden="true" />
                    <div className={styles.cardContent}>
                      <div className={styles.collegeIconWrapper}>
                        <GraduationCap size={20} />
                      </div>
                      <span className={styles.collegeName}>{college.fullName}</span>
                      <div className={styles.cardArrow} aria-hidden="true">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                    <div className={styles.cardIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;
