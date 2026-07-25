"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/utils/apiUtils";

interface CachedCartCount {
  count: number;
  timestamp: number;
  userId: string | null;
}

export type CartCountUpdateDetail = {
  /** Absolute total quantity already known (preferred — no API). */
  count?: number;
  /** Optimistic bump after a successful +/-1 mutation (no API). */
  delta?: number;
  /** User the count belongs to; kept in localStorage cache. */
  userId?: string | null;
  /** Rare full refetch for this browser session only (e.g. auth change). */
  sync?: boolean;
};

const CART_COUNT_CACHE_KEY = "cart_count_cache";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const CART_COUNT_UPDATE_EVENT = "cartCountUpdated";

export function sumCartQuantities(
  items: Array<{ quantity?: number }> | null | undefined
): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

function readCache(): CachedCartCount | null {
  try {
    const cached = localStorage.getItem(CART_COUNT_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as CachedCartCount;
  } catch {
    return null;
  }
}

function writeCache(count: number, userId: string | null): void {
  const cacheData: CachedCartCount = {
    count: Math.max(0, count),
    timestamp: Date.now(),
    userId,
  };
  localStorage.setItem(CART_COUNT_CACHE_KEY, JSON.stringify(cacheData));
}

/**
 * Per-browser cart badge sync.
 * Never broadcasts to other users / tenants — only this tab's UI + localStorage.
 * Prefer { count } or { delta } so the header does not hit the API again.
 */
export function notifyCartCountChanged(detail: CartCountUpdateDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CartCountUpdateDetail>(CART_COUNT_UPDATE_EVENT, { detail })
  );
}

/**
 * Hook for navbar cart badge.
 * Mutations should call notifyCartCountChanged({ delta } | { count }) —
 * that updates local state only. API fetch happens once on mount (if cache miss)
 * or when sync:true (auth change).
 */
export const useCartCount = () => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getCachedCount = useCallback((): CachedCartCount | null => {
    const parsed = readCache();
    if (!parsed) return null;
    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
      return parsed;
    }
    localStorage.removeItem(CART_COUNT_CACHE_KEY);
    return null;
  }, []);

  const getUserId = useCallback(async (): Promise<string | null> => {
    try {
      const response = await api.get("/api/user/auth/user");
      const user = response.data;
      return user._id || user.id || null;
    } catch {
      return null;
    }
  }, []);

  const fetchCartCount = useCallback(
    async (userId: string | null, forceRefresh: boolean = false) => {
      if (!forceRefresh) {
        const cached = getCachedCount();
        if (cached) {
          const currentUserId = userId || (await getUserId());
          if (cached.userId === currentUserId) {
            setCount(cached.count);
            return cached.count;
          }
        }
      }

      setIsLoading(true);
      try {
        const currentUserId = userId || (await getUserId());

        if (!currentUserId) {
          const guestCart = localStorage.getItem("guest_cart") || "[]";
          try {
            const guestCartItems = JSON.parse(guestCart);
            const guestCount = sumCartQuantities(guestCartItems);
            writeCache(guestCount, null);
            setCount(guestCount);
            return guestCount;
          } catch {
            setCount(0);
            return 0;
          }
        }

        const response = await api.get(`/cart/${currentUserId}`);
        const itemCount = sumCartQuantities(response.data.cart || []);
        writeCache(itemCount, currentUserId);
        setCount(itemCount);
        return itemCount;
      } catch (error) {
        console.error("Error fetching cart count:", error);
        setCount(0);
        return 0;
      } finally {
        setIsLoading(false);
      }
    },
    [getCachedCount, getUserId]
  );

  const applyLocalUpdate = useCallback((detail: CartCountUpdateDetail) => {
    const cached = readCache();
    const userId =
      detail.userId !== undefined ? detail.userId : cached?.userId ?? null;

    if (typeof detail.count === "number" && Number.isFinite(detail.count)) {
      const next = Math.max(0, detail.count);
      writeCache(next, userId);
      setCount(next);
      return;
    }

    if (typeof detail.delta === "number" && Number.isFinite(detail.delta)) {
      setCount((prev) => {
        const base = cached && Date.now() - cached.timestamp < CACHE_DURATION
          ? cached.count
          : prev;
        const next = Math.max(0, base + detail.delta!);
        writeCache(next, userId);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const initializeCartCount = async () => {
      const userId = await getUserId();
      await fetchCartCount(userId, false);
    };

    initializeCartCount();

    const handleCartUpdate = async (event: Event) => {
      const detail = (event as CustomEvent<CartCountUpdateDetail>).detail || {};

      // Optimistic / already-known totals — no network.
      if (
        !detail.sync &&
        (typeof detail.count === "number" || typeof detail.delta === "number")
      ) {
        applyLocalUpdate(detail);
        return;
      }

      // Legacy bare Event or explicit sync — one GET for this user only.
      const userId = await getUserId();
      await fetchCartCount(userId, true);
    };

    const handleAuthChange = async () => {
      const userId = await getUserId();
      await fetchCartCount(userId, true);
    };

    window.addEventListener(CART_COUNT_UPDATE_EVENT, handleCartUpdate);
    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener(CART_COUNT_UPDATE_EVENT, handleCartUpdate);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, [fetchCartCount, getUserId, applyLocalUpdate]);

  const refreshCount = useCallback(async () => {
    const userId = await getUserId();
    await fetchCartCount(userId, true);
  }, [fetchCartCount, getUserId]);

  return { count, isLoading, refreshCount };
};
