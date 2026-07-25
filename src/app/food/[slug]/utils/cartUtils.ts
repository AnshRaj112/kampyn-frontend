import { toast } from "react-toastify";
import { FoodItem, CartItem, Vendor } from "../types";
import { SearchResult } from '@/app/components/search/SearchBar/SearchBar';
import { userApi } from "@/utils/apiUtils";
import { notifyCartCountChanged } from "@/app/hooks/useCartCount";

export const checkItemAvailability = async (
  item: FoodItem,
  currentVendorId: string | null,
  categories?: { retail: string[]; produce: string[] }
): Promise<{ isAvailable: boolean; vendors: Vendor[] | undefined }> => {
  try {
    const response = await userApi.get(`/api/item/vendors/${item.id}`);

    if (response.status !== 200) {
      return { isAvailable: false, vendors: undefined };
    }

    const vendors = response.data;

    if (!vendors || vendors.length === 0) {
      return { isAvailable: false, vendors: undefined };
    }

    // Filter out vendors where the item is not available
    const availableVendors = vendors.filter((vendor: Vendor) => {
      if (!vendor.inventoryValue) {
        return false;
      }

      // Check if the item is retail based on item.type (preferred) or fallback to categories
      const isRetail = item.type === "retail" || (categories?.retail.includes(item.category) ?? false);

      if (isRetail) {
        // For retail items, check quantity from inventoryValue
        const quantity = vendor.inventoryValue.quantity;
        // Check if quantity exists and is greater than 0
        const isAvailable = typeof quantity === "number" && quantity > 0;
        return isAvailable;
      } else {
        // For produce items, check isAvailable from inventoryValue
        const isAvailable = vendor.inventoryValue.isAvailable === "Y";
        return isAvailable;
      }
    });

    // If currentVendorId is provided, check if that vendor is available
    if (currentVendorId) {
      const currentVendor = availableVendors.find(
        (v: Vendor) => v._id === currentVendorId
      );
      return {
        isAvailable: !!currentVendor,
        vendors: currentVendor ? [currentVendor] : undefined,
      };
    }

    // Return all available vendors if no currentVendorId is provided
    return { isAvailable: true, vendors: availableVendors };
  } catch {
    return { isAvailable: false, vendors: undefined };
  }
};

export const addToCart = async (
  userId: string,
  item: FoodItem | SearchResult,
  vendorId: string
): Promise<boolean> => {
  try {
    const kind = item.type === "retail" ? "Retail" : "Produce";
    const response = await userApi.post(`/cart/add/${userId}`, {
      itemId: item.id,
      kind: kind,
      quantity: 1,
      vendorId: vendorId,
    });

    if (response.status !== 200) {
      const error = response.data;
      throw new Error(error.message);
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`${item.title} added to cart!`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart"
    );
    return false;
  }
};

export const increaseQuantity = async (
  userId: string,
  item: FoodItem | SearchResult
): Promise<boolean> => {
  try {
    const kind = item.type === "retail" ? "Retail" : "Produce";
    const response = await userApi.post(`/cart/add-one/${userId}`, {
      itemId: item.id,
      kind: kind,
      vendorId: item.vendorId,
    });

    if (response.status !== 200) {
      const error = response.data;
      throw new Error(error.message);
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`Increased quantity of ${item.title}`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to increase quantity"
    );
    return false;
  }
};

export const decreaseQuantity = async (
  userId: string,
  item: FoodItem | SearchResult
): Promise<boolean> => {
  try {
    const kind = item.type === "retail" ? "Retail" : "Produce";
    const response = await userApi.post(`/cart/remove-one/${userId}`, {
      itemId: item.id,
      kind: kind,
      vendorId: item.vendorId,
    });

    if (response.status !== 200) {
      const error = response.data;
      throw new Error(error.message);
    }

    notifyCartCountChanged({ delta: -1, userId });
    toast.info(`Decreased quantity of ${item.title}`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to decrease quantity"
    );
    return false;
  }
};

export const fetchCartItems = async (userId: string): Promise<CartItem[]> => {
  try {
    const response = await userApi.get(`/cart/${userId}`);

    if (response.status !== 200) {
      const error = response.data;
      throw new Error(error.message);
    }

    const data = response.data;
    const cartItems = data.cart || [];

    return cartItems;
  } catch {
    return [];
  }
};