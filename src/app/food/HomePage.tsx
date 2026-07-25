"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, AlertCircle } from "lucide-react";
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
    .replace(/[^a-z0-9]+/g, "-") // Replace any non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
};

const HomePage = () => {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await api.get("/api/user/auth/list");
        if (response.status !== 200) {
          throw new Error("Failed to fetch colleges");
        }
        const data = response.data;
        // Add slugs to the college data
        const collegesWithSlugs = data.map((college: College) => ({
          ...college,
          slug: generateSlug(college.fullName),
        }));
        setColleges(collegesWithSlugs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    };

    fetchColleges();
  }, []);

  const handleCollegeClick = (college: College) => {
    // Store the college ID in localStorage before navigation
    localStorage.setItem('currentCollegeId', college._id);
    router.push(`/food/${college.slug}`);
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorState}>
            <div className={styles.errorIconWrapper}>
              <AlertCircle className={styles.errorIcon} size={64} />
            </div>
            <h1 className={styles.heading}>Oops! Something went wrong</h1>
            <p className={styles.error}>{error}</p>
            <button
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGradient}></div>
      <div className={styles.content}>
        <div className={styles.headerSection}>
          <div className={styles.iconWrapper}>
            <GraduationCap className={styles.headerIcon} size={48} />
          </div>
          <h1 className={styles.heading}>Discover Your Campus</h1>
          <p className={styles.subtitle}>
            Select your college to explore delicious food options and place your order
          </p>
        </div>

        <div className={styles.collegeGrid}>
          {colleges
            .filter((college) => college.slug) // Ensure slug is defined
            .map((college, index) => (
              <div
                key={college._id}
                className={styles.collegeCard}
                data-theme-component="card.restaurant"
                onClick={() => handleCollegeClick(college)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.cardGradient}></div>
                <div className={styles.cardContent}>
                  <div className={styles.collegeIcon}>
                    <GraduationCap size={24} />
                  </div>
                  <span className={styles.collegeName}>{college.fullName}</span>
                  <div className={styles.chevronWrapper}>
                    <ChevronRight className={styles.chevronIcon} size={20} />
                  </div>
                </div>
                <div className={styles.cardHoverEffect}></div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
