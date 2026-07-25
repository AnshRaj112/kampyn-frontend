"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SearchResult } from '../search/SearchBar/SearchBar';
import { notifyCartCountChanged, sumCartQuantities } from '@/app/hooks/useCartCount';
import api from '@/utils/apiUtils';

interface CartItemResponse {
  itemId: string;
  name: string;
  price: number;
  image: string;
  unit: string;
  quantity: number;
  kind: string;
  totalPrice: number;
}

interface SearchCartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  type: string;
  category: string;
  isSpecial: boolean;
  vendorId: string;
  quantity: number;
}

interface SearchCartContextType {
  searchCartItems: SearchCartItem[];
  userId: string | null;
  addToSearchCart: (item: SearchResult, vendorId: string) => Promise<void>;
  increaseSearchCartQuantity: (itemId: string) => Promise<void>;
  decreaseSearchCartQuantity: (itemId: string) => Promise<void>;
  refreshSearchCart: () => Promise<void>;
}

const SearchCartContext = createContext<SearchCartContextType | undefined>(undefined);

export const useSearchCart = () => {
  const context = useContext(SearchCartContext);
  if (!context) {
    throw new Error('useSearchCart must be used within a SearchCartProvider');
  }
  return context;
};

interface SearchCartProviderProps {
  children: React.ReactNode;
}

export const SearchCartProvider = ({ children }: SearchCartProviderProps) => {
  const [searchCartItems, setSearchCartItems] = useState<SearchCartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isNonShopperSession = useCallback(() => {
    if (typeof window === "undefined") return false;

    const vendorRole = localStorage.getItem("vendorRole");
    const uniId = localStorage.getItem("uniId");
    const adminToken = localStorage.getItem("adminToken");
    const pathname = window.location.pathname.toLowerCase();
    const isNonShopperRoute =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/vendor") ||
      pathname.startsWith("/uni");

    return Boolean(vendorRole || uniId || adminToken || isNonShopperRoute);
  }, []);

  const getUserId = useCallback(async () => {
    if (userId) return userId;

    // Skip shopper profile checks entirely in non-shopper sessions/routes.
    if (isNonShopperSession()) {
      return null;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }

    try {
      const response = await api.get("/api/user/auth/user");
      if (response.status !== 200) {
        return null;
      }
      const user = response.data;
      const id = user._id || user.id;
      setUserId(id);
      return id;
    } catch (error: unknown) {
      // Handle 401 silently - it's usually expected if the user isn't logged into a shopper account
      const err = error as { response?: { status: number } };
      if (err?.response?.status === 401) {
        return null;
      }
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [userId, isNonShopperSession]);

  const refreshSearchCart = useCallback(async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      const token = localStorage.getItem("token");
      if (!token || isNonShopperSession()) {
        console.log('No token found, skipping cart refresh');
        return;
      }

      const currentUserId = await getUserId();
      if (!currentUserId) {
        console.log('No user ID found, skipping cart refresh');
        return;
      }

      const response = await api.get(`/cart/${currentUserId}`);

      if (response.status !== 200) {
        console.log('Cart fetch failed:', response.status, response.statusText);
        return;
      }

      const data = response.data;
      // Transform the cart items to match our search cart structure
      const transformedItems = data.cart.map((item: CartItemResponse) => ({
        id: item.itemId,
        name: item.name,
        price: item.price,
        image: item.image,
        type: item.kind.toLowerCase(),
        category: item.kind,
        isSpecial: false,
        vendorId: data.vendorId,
        quantity: item.quantity
      }));
      setSearchCartItems(transformedItems);
      // Local badge update from already-fetched cart — no second GET
      notifyCartCountChanged({
        count: sumCartQuantities(transformedItems),
        userId: currentUserId,
      });
    } catch (error) {
      console.error('Error refreshing search cart:', error);
      // Don't show toast for expected errors like no user ID
      if (error instanceof Error && !error.message.includes('Failed to get user ID')) {
        toast.error('Failed to refresh cart');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, getUserId, isNonShopperSession]);

  // Only refresh cart on mount
  useEffect(() => {
    refreshSearchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means it only runs once on mount

  const addToSearchCart = async (item: SearchResult, vendorId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isNonShopperSession()) {
        toast.error('Please login to add items to cart');
        return;
      }

      const currentUserId = await getUserId();
      // Validate required fields
      if (!currentUserId) {
        throw new Error('User ID is required');
      }
      if (!vendorId) {
        throw new Error('Vendor ID is required');
      }

      // Log the full item for debugging
      console.log('Full item data:', item);

      // Try to get the item ID in order of preference
      const itemId = item._id || item.id || item.itemId;
      if (!itemId) {
        console.error('Item missing all possible ID fields:', item);
        throw new Error('Item ID is missing');
      }

      // Determine the kind based on the item's source, kind, or type
      let kind;
      if (item.source) {
        kind = item.source.charAt(0).toUpperCase() + item.source.slice(1);
      } else if (item.kind && (item.kind.toLowerCase() === 'retail' || item.kind.toLowerCase() === 'produce')) {
        kind = item.kind.charAt(0).toUpperCase() + item.kind.slice(1);
      } else if (item.type === 'retail' || item.type === 'produce') {
        kind = item.type.charAt(0).toUpperCase() + item.type.slice(1);
      } else {
        // Fallback for other cases
        kind = 'Retail';
      }

      const requestData = {
        itemId: itemId,
        kind: kind,
        vendorId: vendorId,
        quantity: 1
      };

      const response = await api.post(`/cart/add/${currentUserId}`, requestData);

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        console.error('Cart addition failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.message || 'Failed to add item to cart');
      }

      notifyCartCountChanged({ delta: 1, userId: currentUserId });
      await refreshSearchCart();
      toast.success(`${item.name || item.title || 'Item'} added to cart!`);
    } catch (error) {
      console.error('Error adding to search cart:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
      throw error;
    }
  };

  const increaseSearchCartQuantity = async (itemId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isNonShopperSession()) return;

      const currentUserId = await getUserId();
      if (!currentUserId) return;

      // Find the item in the cart to get its type
      const item = searchCartItems.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item not found in cart');
      }

      const response = await api.post(`/cart/add-one/${currentUserId}`, {
        itemId,
        kind: item.type === 'retail' ? 'Retail' : 'Produce'
      });

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        if (errorData.message?.includes('maximum quantity')) {
          toast.info('Maximum quantity reached for this item');
          return;
        }
        throw new Error(errorData.message || 'Failed to increase quantity');
      }

      notifyCartCountChanged({ delta: 1, userId: currentUserId });
      await refreshSearchCart();
      toast.success('Quantity increased');
    } catch (error) {
      console.error('Error increasing quantity:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to increase quantity');
    }
  };

  const decreaseSearchCartQuantity = async (itemId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isNonShopperSession()) return;

      const currentUserId = await getUserId();
      if (!currentUserId) return;

      // Find the item in the cart to get its type
      const item = searchCartItems.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Item not found in cart');
      }

      const response = await api.post(`/cart/remove-one/${currentUserId}`, {
        itemId,
        kind: item.type === 'retail' ? 'Retail' : 'Produce'
      });

      if (response.status !== 200 && response.status !== 201) {
        const errorData = response.data;
        if (errorData.message?.includes('minimum quantity')) {
          toast.info('Minimum quantity reached');
          return;
        }
        throw new Error(errorData.message || 'Failed to decrease quantity');
      }

      notifyCartCountChanged({ delta: -1, userId: currentUserId });
      await refreshSearchCart();
      toast.info('Quantity decreased');
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to decrease quantity');
    }
  };

  return (
    <SearchCartContext.Provider
      value={{
        searchCartItems,
        userId,
        addToSearchCart,
        increaseSearchCartQuantity,
        decreaseSearchCartQuantity,
        refreshSearchCart,
      }}
    >
      {children}
    </SearchCartContext.Provider>
  );
}; 