import { FavoriteItem, Vendor } from "../types";
import { toast } from "react-toastify";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const checkFavoriteItemAvailability = async (
  item: FavoriteItem,
  currentVendorId: string | null,
  categories: { retail: string[]; produce: string[] }
): Promise<{ isAvailable: boolean; vendors: Vendor[] | undefined }> => {
  try {
    console.log(`Fetching vendors for favorite item ${item._id}`);
    const response = await fetch(`${BACKEND_URL}/api/item/vendors/${item._id}`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const vendors = await response.json();
    console.log(`All vendors for favorite item:`, vendors);
    console.log(`Favorite item type:`, item.type);
    console.log(`Favorite item kind:`, item.kind);

    // Filter out vendors where the item is not available
    const availableVendors = vendors.filter((vendor: Vendor) => {
      if (!vendor.inventoryValue) {
        console.log(`Vendor ${vendor._id} has no inventoryValue`);
        return false;
      }

      // First check if the kind is in retail categories
      const isRetailByCategory = categories.retail.includes(item.kind);
      // Then check if type is retail
      const isRetailByType = item.type.toLowerCase() === "retail";
      // Item is retail if either condition is true
      const isRetailItem = isRetailByCategory || isRetailByType;
      
      console.log(`Is retail by category:`, isRetailByCategory);
      console.log(`Is retail by type:`, isRetailByType);
      console.log(`Is retail item:`, isRetailItem);

      if (isRetailItem) {
        // For retail items, check quantity from inventoryValue
        const quantity = vendor.inventoryValue.quantity;
        console.log(`Vendor ${vendor._id} quantity:`, quantity);
        // Check if quantity exists and is greater than 0
        const isAvailable = typeof quantity === "number" && quantity > 0;
        console.log(`Vendor ${vendor._id} is available:`, isAvailable);
        return isAvailable;
      } else {
        // For produce items, check isAvailable from inventoryValue
        const isAvailable = vendor.inventoryValue.isAvailable === "Y";
        console.log(`Vendor ${vendor._id} is available:`, isAvailable);
        return isAvailable;
      }
    });

    console.log(`Available vendors after filtering:`, availableVendors);

    if (availableVendors.length === 0) {
      return { isAvailable: false, vendors: undefined };
    }

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

    return { isAvailable: true, vendors: availableVendors };
  } catch (error) {
    console.error("Error checking favorite item availability:", error);
    return { isAvailable: false, vendors: undefined };
  }
};

export const addFavoriteToCart = async (
  userId: string,
  item: FavoriteItem,
  vendorId: string,
  categories: { retail: string[]; produce: string[] }
): Promise<boolean> => {
  try {
    const kind = categories.retail.includes(item.kind) ? "Retail" : "Produce";
    
    const response = await fetch(`${BACKEND_URL}/cart/add/${userId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        itemId: item._id,
        kind: kind,
        quantity: 1,
        vendorId: vendorId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    toast.success(`${item.name} added to cart!`);
    return true;
  } catch (error) {
    console.error("Error adding favorite to cart:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart"
    );
    return false;
  }
}; 