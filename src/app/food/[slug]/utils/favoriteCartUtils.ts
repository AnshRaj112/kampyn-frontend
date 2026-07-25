import { FavoriteItem, Vendor } from "../types";
import { toast } from "react-toastify";

import api from "@/utils/apiUtils";
import { notifyCartCountChanged } from "@/app/hooks/useCartCount";

// const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""; // Handled by apiUtils

export const checkFavoriteItemAvailability = async (
  item: FavoriteItem,
  currentVendorId: string | null,
  categories: { retail: string[]; produce: string[] }
): Promise<{ isAvailable: boolean; vendors: Vendor[] | undefined }> => {
  try {
    const userRes = await api.get("/api/user/auth/user");
    const userId = userRes.data._id;

    const [vendorRes, favRes] = await Promise.all([
      api.get(`/api/item/vendors/${item._id}`),
      api.get(`/fav/${userId}`),
    ]);

    const allVendors: Vendor[] = vendorRes.data;
    const userFavorites: FavoriteItem[] = favRes.data.favourites || [];

    const favoriteVendorSet = new Set(
      userFavorites
        .filter((fav) => fav._id === item._id)
        .map((fav) => fav.vendorId)
    );

    const isRetail = item.kind.toLowerCase() === "retail" || categories.retail.includes(item.kind.toLowerCase());

    const availableVendors = allVendors.filter((vendor) => {
      if (!favoriteVendorSet.has(vendor._id) || !vendor.inventoryValue) return false;

      if (isRetail) {
        return typeof vendor.inventoryValue.quantity === "number" && vendor.inventoryValue.quantity > 0;
      } else {
        return vendor.inventoryValue.isAvailable === "Y";
      }
    });

    if (currentVendorId) {
      const currentVendor = availableVendors.find((v) => v._id === currentVendorId);
      return {
        isAvailable: !!currentVendor,
        vendors: currentVendor ? [currentVendor] : undefined,
      };
    }

    return {
      isAvailable: availableVendors.length > 0,
      vendors: availableVendors.length > 0 ? availableVendors : undefined,
    };
  } catch {
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
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to add items to cart");
      return false;
    }

    if (!vendorId) {
      toast.error("Please select a vendor first");
      return false;
    }

    const isRetail = item.kind.toLowerCase() === "retail" || categories.retail.includes(item.kind.toLowerCase());

    const requestData = {
      itemId: item._id,
      kind: isRetail ? "Retail" : "Produce",
      quantity: 1,
      vendorId,
    };

    const response = await api.post(`/cart/add/${userId}`, requestData);

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data.message || "Failed to add favorite to cart");
    }

    notifyCartCountChanged({ delta: 1, userId });
    toast.success(`${item.name} added to cart!`);
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to add item to cart"
    );
    return false;
  }
};
