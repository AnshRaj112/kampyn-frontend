"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '@/utils/apiUtils';
import { FoodItem, CartItem, Vendor } from '../types';
// Direct fetch was used previously, now I'm using api which has base URL.
import { addToCart, increaseQuantity, decreaseQuantity } from '../utils/cartUtils';
import { SearchResult } from '@/app/components/search/SearchBar/SearchBar';
import { notifyCartCountChanged, sumCartQuantities } from '@/app/hooks/useCartCount';


interface CartContextType {
  cartItems: CartItem[];
  addItemToCart: (item: FoodItem | SearchResult, vendor: Vendor) => Promise<void>;
  increaseItemQuantity: (item: FoodItem | SearchResult) => Promise<void>;
  decreaseItemQuantity: (item: FoodItem | SearchResult) => Promise<void>;
  refreshCart: () => Promise<void>;
}

interface CartResponseItem {
  itemId: string;
  name: string;
  image: string;
  unit: string;
  price: number;
  quantity: number;
  kind: string;
  totalPrice: number;
}

interface CartResponse {
  cart: CartResponseItem[];
  vendorId: string;
  vendorName: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export const CartProvider = ({ children, userId }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const isRefreshingRef = useRef(false);

  const refreshCart = useCallback(async () => {
    if (!userId || isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;
      const response = await api.get(`/cart/${userId}`);

      if (response.status !== 200) {
        const error = response.data;
        console.error('Failed to fetch cart items:', error);
        throw new Error(error.message);
      }

      const data = response.data as CartResponse;
      console.log('Raw API response:', data);

      // Transform the cart items to match our expected structure
      const transformedItems = data.cart.map((item) => ({
        _id: item.itemId,
        itemId: item.itemId,
        quantity: item.quantity,
        kind: item.kind,
        vendorId: data.vendorId,
        vendorName: data.vendorName
      }));

      console.log('Transformed cart items:', transformedItems);
      setCartItems(transformedItems);
      // Local badge update from already-fetched cart — no second GET
      notifyCartCountChanged({
        count: sumCartQuantities(transformedItems),
        userId,
      });
    } catch (error) {
      console.error('Error refreshing cart:', error);
      toast.error('Failed to refresh cart');
    } finally {
      isRefreshingRef.current = false;
    }
  }, [userId]);

  // Initial cart load and refresh on mount
  useEffect(() => {
    if (userId) {
      refreshCart();
    }
  }, [userId, refreshCart]);

  const addItemToCart = async (item: FoodItem | SearchResult, vendor: Vendor) => {
    if (!userId || !vendor._id) {
      console.error('Missing userId or vendor._id:', { userId, vendorId: vendor._id });
      return;
    }

    try {
      console.log('Adding item to cart:', { item, vendor });
      const success = await addToCart(userId, item, vendor._id);
      if (success) {
        await refreshCart(); // Refresh cart after successful addition
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  };

  const increaseItemQuantity = async (item: FoodItem | SearchResult) => {
    if (!userId || !item.vendorId) {
      console.error('Missing userId or item.vendorId:', { userId, vendorId: item.vendorId });
      return;
    }

    try {
      console.log('Increasing quantity for item:', item);
      const success = await increaseQuantity(userId, item);
      if (success) {
        await refreshCart(); // Refresh cart after successful increase
      }
    } catch (error) {
      console.error('Error increasing quantity:', error);
      throw error;
    }
  };

  const decreaseItemQuantity = async (item: FoodItem | SearchResult) => {
    if (!userId || !item.vendorId) {
      console.error('Missing userId or item.vendorId:', { userId, vendorId: item.vendorId });
      return;
    }

    try {
      console.log('Decreasing quantity for item:', item);
      const success = await decreaseQuantity(userId, item);
      if (success) {
        await refreshCart(); // Refresh cart after successful decrease
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addItemToCart,
        increaseItemQuantity,
        decreaseItemQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 