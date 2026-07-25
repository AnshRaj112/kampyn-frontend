import React from "react";
import { Loader2 } from "lucide-react";
import { FoodItem } from "@/app/food/[slug]/types";
import styles from "./DishListItem.module.scss";

interface DishQuantityControlsProps {
  item: FoodItem;
  quantity: number;
  isLoading: boolean;
  inStock: boolean;
  onAdd: (item: FoodItem) => void;
  onIncrease: (item: FoodItem) => void;
  onDecrease: (item: FoodItem) => void;
}

const DishQuantityControls: React.FC<DishQuantityControlsProps> = ({
  item,
  quantity,
  isLoading,
  inStock,
  onAdd,
  onIncrease,
  onDecrease,
}) => {
  if (quantity > 0) {
    return (
      <div className={styles.quantityControls}>
        <button
          className={`${styles.qtyBtn} ${styles.decrease}`}
          onClick={() => onDecrease(item)}
          disabled={isLoading}
        >
          -
        </button>
        <span className={styles.qtyValue}>
          {isLoading ? <Loader2 className={styles.spinner} size={14} /> : quantity}
        </span>
        <button
          className={`${styles.qtyBtn} ${styles.increase}`}
          onClick={() => onIncrease(item)}
          disabled={isLoading}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      className={styles.addBtn}
      data-theme-component="button.addToCart"
      onClick={() => onAdd(item)}
      disabled={!inStock || isLoading}
      style={{
        opacity: inStock && !isLoading ? 1 : 0.5,
        cursor: inStock && !isLoading ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
      }}
    >
      {isLoading && <Loader2 className={styles.spinner} size={14} />}
      {isLoading ? "Adding..." : "Add +"}
    </button>
  );
};

export default DishQuantityControls;
