"use client";

import React from "react";
import styles from "./DishCard.module.scss";

type Props = {
  dishName: string;
  price: number;
  image: string;
  variant?: "list" | "search-result";
};

const DishCard: React.FC<Props> = ({ dishName, price, image, variant = "list" }) => {
  const isSearch = variant === "search-result";

  return (
    <div
      className={`${styles.dishCard} ${isSearch ? styles.searchResult : styles.list}`}
      data-theme-component="card.dish"
    >
      <img
        src={image}
        alt={dishName}
        className={isSearch ? styles.imageSearch : styles.imageList}
      />
      <div className={styles.content}>
        <h3>{dishName}</h3>
        <p>₹ {price}</p>
      </div>
    </div>
  );
};

export default DishCard;
