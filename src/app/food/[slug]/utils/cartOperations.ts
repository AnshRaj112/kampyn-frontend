import { FoodItem, CartItem } from "../types";
import { toast } from "react-toastify";

import api from "@/utils/apiUtils";
import { notifyCartCountChanged } from "@/app/hooks/useCartCount";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""; // Handled by apiUtils

export const addItemToCart = async (
  userId: string,
  item: FoodItem,
  vendorId: string,
  categories: { retail: string[]; produce: string[] }
): Promise<boolean> => {
  try {
    const kind = categories.retail.includes(item.category) ? "Retail" : "Produce";

    const response = await api.post(`/cart/add/${userId}`, {
      itemId: item.id,
      kind: kind,
      quantity: 1,
      vendorId: vendorId,
    });

    // axios throws for non-2xx by default, but we can check status if needed
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to add to cart");
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`${item.title} added to cart!`);
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart"
    );
    return false;
  }
};

export const increaseItemQuantity = async (
  userId: string,
  item: FoodItem,
  categories: { retail: string[]; produce: string[] }
): Promise<boolean> => {
  try {
    const kind = categories.retail.includes(item.category) ? "Retail" : "Produce";

    const response = await api.post(`/cart/add-one/${userId}`, {
      itemId: item.id,
      kind: kind,
      vendorId: item.vendorId,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to increase quantity");
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`Increased quantity of ${item.title}`);
    return true;
  } catch (error) {
    console.error("Error increasing quantity:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to increase quantity"
    );
    return false;
  }
};

export const decreaseItemQuantity = async (
  userId: string,
  item: FoodItem,
  categories: { retail: string[]; produce: string[] }
): Promise<boolean> => {
  try {
    const kind = categories.retail.includes(item.category) ? "Retail" : "Produce";

    const response = await api.post(`/cart/remove-one/${userId}`, {
      itemId: item.id,
      kind: kind,
      vendorId: item.vendorId,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to decrease quantity");
    }

    notifyCartCountChanged({ delta: -1, userId });
    toast.info(`Decreased quantity of ${item.title}`);
    return true;
  } catch (error) {
    console.error("Error decreasing quantity:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to decrease quantity"
    );
    return false;
  }
};

export const fetchUserCart = async (userId: string): Promise<CartItem[]> => {
  try {
    const response = await api.get(`/cart/${userId}`);
    const data = response.data;
    return data.cart || [];
  } catch (error) {
    console.error("Error fetching cart:", error);
    return [];
  }
}; 