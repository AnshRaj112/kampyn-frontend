import { toast } from "react-toastify";
import api from "@/utils/apiUtils";
import { notifyCartCountChanged } from "@/app/hooks/useCartCount";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // Handled by apiUtils

interface VendorItem {
  itemId: string;
  name: string;
  type?: string;
  price: number;
  image?: string;
  quantity?: number;
  isAvailable?: string;
}

const getItemKind = (item: VendorItem & { category?: string }): "Retail" | "Produce" => {
  // Prefer explicit inventory category; fall back to legacy type field.
  const kindSource = (item.category || item.type || "").toLowerCase();
  if (kindSource === "retail") return "Retail";
  if (kindSource === "produce") return "Produce";
  // Menu types like "Beverage" / "ITALIAN" are NOT inventory kinds — default Produce for food, Retail only if quantity stocked
  if (item.quantity !== undefined) return "Retail";
  return "Produce";
};

export const addToCart = async (
  userId: string,
  item: VendorItem,
  vendorId: string
): Promise<boolean> => {
  try {
    // Validate itemId
    if (!item.itemId || item.itemId === '') {
      throw new Error('Invalid item ID: itemId is missing or empty');
    }

    const kind = getItemKind(item);

    console.log('DEBUG: Cart request data:', {
      itemId: item.itemId,
      kind: kind,
      quantity: 1,
      vendorId: vendorId,
      itemName: item.name
    });

    const response = await api.post(`/cart/add/${userId}`, {
      itemId: item.itemId,
      kind: kind,
      quantity: 1,
      vendorId: vendorId,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to add to cart");
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`${item.name} added to cart!`);
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart"
    );
    return false;
  }
};

export const increaseQuantity = async (
  userId: string,
  item: VendorItem,
  vendorId: string
): Promise<boolean> => {
  try {
    // Validate itemId
    if (!item.itemId || item.itemId === '') {
      throw new Error('Invalid item ID: itemId is missing or empty');
    }

    const kind = getItemKind(item);
    const response = await api.post(`/cart/add-one/${userId}`, {
      itemId: item.itemId,
      kind: kind,
      vendorId: vendorId,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to increase quantity");
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`Increased quantity of ${item.name}`);
    return true;
  } catch (error) {
    console.error("Error increasing quantity:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to increase quantity"
    );
    return false;
  }
};

export const decreaseQuantity = async (
  userId: string,
  item: VendorItem,
  vendorId: string
): Promise<boolean> => {
  try {
    // Validate itemId
    if (!item.itemId || item.itemId === '') {
      throw new Error('Invalid item ID: itemId is missing or empty');
    }

    const kind = getItemKind(item);
    const response = await api.post(`/cart/remove-one/${userId}`, {
      itemId: item.itemId,
      kind: kind,
      vendorId: vendorId,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to decrease quantity");
    }

    notifyCartCountChanged({ delta: -1, userId });
    toast.success(`Decreased quantity of ${item.name}`);
    return true;
  } catch (error) {
    console.error("Error decreasing quantity:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to decrease quantity"
    );
    return false;
  }
}; 