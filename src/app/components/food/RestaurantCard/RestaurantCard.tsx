import React from "react";
import styles from "./RestaurantCard.module.scss";


type Props = {
  restaurantName: string;
  restaurantImage: string;
  description?: string;
  cuisine: string;
  location: string;
  distance: string;
  rating: number;
  variant?: "default" | "highlight" | "landing";
};

const RestaurantCard: React.FC<Props> = ({
  restaurantName,
  restaurantImage,
  description,
  cuisine,
  location,
  distance,
  rating,
  variant = "default",
}) => {
  return (
    <div
      className={`${styles.card} ${
        variant === "highlight"
          ? styles.highlight
          : variant === "landing"
          ? styles.landing
          : styles.default
      }`}
      data-theme-component="card.restaurant"
    >
      <div className={styles.imageWrapper}>
        <img src={restaurantImage} alt={restaurantName} className={styles.image} />
        {variant !== "default" && (
          <div className={styles.overlay}>
            <h2 className={styles.name}>{restaurantName}</h2>
            <span className={styles.rating}>★ {rating}</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        {variant === "default" && (
          <>
            <h2 className={styles.name}>{restaurantName}</h2>
            <p className={styles.description}>{description}</p>
            <div className={styles.info}>
              <span>{cuisine}</span>
              <span>{rating} ⭐</span>
            </div>
          </>
        )}

        {variant === "landing" && (
          <>
            <p className={styles.meta}>{cuisine}</p>
            <p className={styles.meta}>
              {location} • {distance}
            </p>
            <span className={styles.booking}>Table booking</span>
            <div className={styles.offer}>Flat 25% off on pre-booking + 3 more</div>
            <div className={styles.offerSecondary}>Up to 10% off with bank offers</div>
          </>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;
