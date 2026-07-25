"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";

import styles from "./styles/FavouriteFoodPage.module.scss";
import { userApi } from "@/utils/apiUtils";
import { useRouter, useSearchParams } from "next/navigation";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaChevronDown } from "react-icons/fa";
import DishListItem from "@/app/components/food/DishListItem/DishListItemV2";
import { FoodItem as HomeFoodItem } from "@/app/food/[slug]/types";
import axios from "axios";
import { notifyCartCountChanged, sumCartQuantities } from "@/app/hooks/useCartCount";

interface FoodItem {
  _id: string;
  name: string;
  type: string;
  uniId: string;
  unit?: string;
  price: number;
  image: string;
  isSpecial: string;
  kind: string;
  vendorId: string;
  vendorName?: string;
}

interface College {
  _id: string;
  fullName: string;
  shortName: string;
}

interface Vendor {
  _id: string;
  name: string;
  price: number;
  inventoryValue: {
    price: number;
    quantity: number;
    isAvailable?: string;
  };
}

interface User {
  _id: string;
  name: string;
}

interface CartItem {
  _id: string;
  quantity: number;
  kind: string;
  vendorId: string;
  vendorName: string;
}

interface CartResponseItem {
  itemId: string;
  quantity: number;
  kind: string;
  vendorId: string;
  vendorName: string;
}

const FavouriteFoodPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<{ [key: string]: string }>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);


  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await userApi.get("/api/user/auth/user");
        setUser(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      }
    };
    fetchUserDetails();
  }, [router]);

  // Fetch colleges list
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await userApi.get("/api/user/auth/list");
        setColleges(response.data);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      }
    };
    fetchColleges();
  }, [router]);

  // Fetch favorites based on selected college
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const url = selectedCollege
          ? `/fav/${user._id}/${selectedCollege._id}`
          : `/fav/${user._id}`;

        const response = await userApi.get(url);
        setFavorites(response.data.favourites);
        setFavoriteIds(response.data.favourites.map((f: FoodItem) => `${f._id}-${f.vendorId}`));
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user?._id, selectedCollege, router]);

  const convertItemToHomeFoodItem = (item: FoodItem): HomeFoodItem => {
    return {
      id: item._id,
      title: item.name,
      image: item.image,
      category: item.kind,
      type: item.type,
      isSpecial: item.isSpecial,
      price: item.price,
      vendorId: item.vendorId,
      collegeId: item.uniId,
      collegeName: colleges.find(c => c._id === item.uniId)?.fullName || "",
      isVeg: (item as unknown as { isVeg?: boolean }).isVeg,
      description: "",
      isAvailable: 'Y'
    };
  };

  const handleToggleFavorite = async (food: FoodItem) => {
    const userId = user?._id;
    if (!userId) return;

    const kind = food.kind;
    const itemId = food._id;
    const vendorId = food.vendorId;
    const favKey = `${itemId}-${vendorId}`;
    const isAlreadyFav = favoriteIds.includes(favKey);

    try {
      // Optimistically update the UI
      setFavoriteIds((prev) =>
        isAlreadyFav ? prev.filter((id) => id !== favKey) : [...prev, favKey]
      );

      // Make PATCH request
      const res = await userApi.patch(`/fav/${userId}/${itemId}/${kind}/${vendorId}`);

      if (res.status !== 200) {
        throw new Error("Failed to update favorite");
      }

      toast.success(
        isAlreadyFav ? "Removed from favorites" : "Added to favorites"
      );
    } catch {
      toast.error("Something went wrong");

      // Revert UI if error
      setFavoriteIds((prev) =>
        isAlreadyFav ? [...prev, favKey] : prev.filter((id) => id !== favKey)
      );
    }
  };


  // Fetch vendors list
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        if (selectedCollege) {
          const response = await userApi.get(`/api/vendor/list/uni/${selectedCollege._id}`);
          const vendorsMap = response.data.reduce(
            (acc: { [key: string]: string }, vendor: Vendor) => {
              acc[vendor._id] = (vendor as unknown as { fullName: string }).fullName || vendor.name;
              return acc;
            },
            {}
          );
          setVendors(vendorsMap);
        } else {
          // Fetch all vendors for all colleges
          const vendorPromises = colleges.map((college) =>
            userApi.get(`/api/vendor/list/uni/${college._id}`)
          );

          const responses = await Promise.all(vendorPromises);
          const allVendors = responses.flatMap((response) => response.data);

          // Create a map of vendor IDs to names, ensuring no duplicates
          const vendorsMap = allVendors.reduce(
            (acc: { [key: string]: string }, vendor: Vendor) => {
              if (!acc[vendor._id]) {
                acc[vendor._id] = (vendor as unknown as { fullName: string }).fullName || vendor.name;
              }
              return acc;
            },
            {}
          );

          setVendors(vendorsMap);
        }
      } catch {
        // Error fetching vendors
      }
    };

    if (colleges.length > 0) {
      fetchVendors();
    }
  }, [selectedCollege, colleges]);

  // Fetch cart items
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user?._id) return;

      try {
        const response = await userApi.get(`/cart/${user._id}`);
        const cartData = response.data.cart || [];
        const formattedCartItems = cartData.map((item: CartResponseItem) => ({
          _id: item.itemId,
          quantity: item.quantity,
          kind: item.kind,
          vendorId: item.vendorId || response.data.vendorId, // Prefer vendorId from item, fallback to response
          vendorName: item.vendorName || response.data.vendorName // Prefer vendorName from item, fallback to response
        }));

        setCartItems(formattedCartItems);

        // Set current vendor ID if there are items in cart
        if (formattedCartItems.length > 0) {
          setCurrentVendorId(formattedCartItems[0].vendorId);
        } else {
          setCurrentVendorId(null);
        }
      } catch {
        // Error fetching cart items
      }
    };

    fetchCartItems();
  }, [user?._id]);

  // Handle URL query parameter on initial load
  useEffect(() => {
    const collegeId = searchParams.get("college");
    if (collegeId && colleges.length > 0) {
      const college = colleges.find((c) => c._id === collegeId);
      if (college) {
        setSelectedCollege(college);
      }
    } else {
      setSelectedCollege(null);
      const params = new URLSearchParams(window.location.search);
      params.delete("college");
      window.history.pushState(null, "", `?${params.toString()}`);
    }
  }, [searchParams, colleges]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCollegeSelect = (college: College | null) => {
    setSelectedCollege(college);
    const params = new URLSearchParams(window.location.search);
    if (college) {
      params.set("college", college._id);
    } else {
      params.delete("college");
    }
    window.history.pushState(null, "", `?${params.toString()}`);
    setIsDropdownOpen(false);
  };

  // Add function to check vendor availability
  const checkVendorAvailability = async (vendorId: string, itemId: string, kind: string) => {
    try {
      // Determine if item is retail or produce based on kind field
      const isRetail = kind === "Retail";
      const isProduce = kind === "Produce";

      const response = await userApi.get(`/api/item/vendors/${itemId}`);

      if (response.status !== 200) {
        return false;
      }

      const vendors = response.data as Vendor[];

      const vendor = vendors.find((v) => v._id === vendorId);

      if (!vendor || !vendor.inventoryValue) {
        return false;
      }

      // For retail items, check quantity
      if (isRetail) {
        const quantity = vendor.inventoryValue.quantity;
        const isAvailable = typeof quantity === 'number' && quantity > 0;
        return isAvailable;
      }
      // For produce items, check isAvailable flag
      else if (isProduce) {
        const isAvailable = vendor.inventoryValue.isAvailable === 'Y';
        return isAvailable;
      }

      return false;
    } catch {
      return false;
    }
  };

  const handleAddToCart = async (foodItem: FoodItem) => {
    if (!user?._id) {
      router.push("/login");
      return;
    }

    try {
      // Check if cart is empty or if item is from same vendor
      if (currentVendorId && currentVendorId !== foodItem.vendorId) {
        toast.error("You can only add items from the same vendor. Please clear your cart first.");
        return;
      }

      // Check vendor availability before proceeding
      const isVendorAvailable = await checkVendorAvailability(foodItem.vendorId, foodItem._id, foodItem.kind);

      if (!isVendorAvailable) {
        toast.error("This item is currently unavailable from the vendor. Please try again later.");
        return;
      }

      // Check if item is already in cart
      const existingItem = cartItems.find(item =>
        item._id === foodItem._id &&
        item.vendorId === foodItem.vendorId
      );

      if (existingItem) {
        // If item exists, increase quantity
        await userApi.post(`/cart/add-one/${user._id}`, {
          itemId: foodItem._id,
          kind: foodItem.kind,
          vendorId: foodItem.vendorId
        });
      } else {
        // If item doesn't exist, add new item
        await userApi.post(`/cart/add/${user._id}`, {
          itemId: foodItem._id,
          kind: foodItem.kind,
          quantity: 1,
          vendorId: foodItem.vendorId
        });
      }

      // Fetch updated cart after adding item
      const response = await userApi.get(`/cart/${user._id}`);
      const cartData = response.data.cart || [];

      // Update cart items with correct vendor information
      const formattedCartItems = cartData.map((item: CartResponseItem) => ({
        _id: item.itemId,
        quantity: item.quantity,
        kind: item.kind,
        vendorId: foodItem.vendorId,
        vendorName: foodItem.vendorName || getVendorName(foodItem.vendorId)
      }));

      setCartItems(formattedCartItems);

      // Set current vendor if not set
      if (!currentVendorId) {
        setCurrentVendorId(foodItem.vendorId);
      }

      notifyCartCountChanged({
        count: sumCartQuantities(formattedCartItems),
        userId: user._id,
      });
      toast.success(`${foodItem.name} added to cart!`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMsg = error.response.data.message;
        if (errorMsg.includes("max quantity")) {
          toast.warning(`Maximum limit reached for ${foodItem.name}`);
        } else if (errorMsg.includes("Only")) {
          toast.warning(`Only ${errorMsg.split("Only ")[1]} available for ${foodItem.name}`);
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error("Failed to add item to cart");
      }
    }
  };

  const handleIncreaseQuantity = async (foodItem: FoodItem) => {
    if (!user?._id) return;

    try {
      // Check vendor availability before proceeding
      const isVendorAvailable = await checkVendorAvailability(foodItem.vendorId, foodItem._id, foodItem.kind);
      if (!isVendorAvailable) {
        toast.error("This item is currently unavailable from the vendor. Please try again later.");
        return;
      }

      await userApi.post(`/cart/add-one/${user._id}`, {
        itemId: foodItem._id,
        kind: foodItem.kind,
        vendorId: foodItem.vendorId
      });

      // Fetch updated cart after increasing quantity
      const response = await userApi.get(`/cart/${user._id}`);
      const cartData = response.data.cart || [];

      // Update cart items with correct vendor information
      const formattedCartItems = cartData.map((item: CartResponseItem) => ({
        _id: item.itemId,
        quantity: item.quantity,
        kind: item.kind,
        vendorId: foodItem.vendorId,
        vendorName: foodItem.vendorName || getVendorName(foodItem.vendorId)
      }));

      setCartItems(formattedCartItems);
      notifyCartCountChanged({
        count: sumCartQuantities(formattedCartItems),
        userId: user._id,
      });
      toast.success(`Increased quantity of ${foodItem.name}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorMsg = error.response.data.message;
        if (errorMsg.includes("max quantity")) {
          toast.warning(`Maximum limit reached for ${foodItem.name}`);
        } else if (errorMsg.includes("Only")) {
          toast.warning(`Only ${errorMsg.split("Only ")[1]} available for ${foodItem.name}`);
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error("Failed to increase quantity");
      }
    }
  };

  const handleDecreaseQuantity = async (foodItem: FoodItem) => {
    if (!user?._id) return;

    try {
      await userApi.post(`/cart/remove-one/${user._id}`, {
        itemId: foodItem._id,
        kind: foodItem.kind,
        vendorId: foodItem.vendorId
      });

      // Fetch updated cart after decreasing quantity
      const response = await userApi.get(`/cart/${user._id}`);
      const cartData = response.data.cart || [];

      // Update cart items with correct vendor information
      const formattedCartItems = cartData.map((item: CartResponseItem) => ({
        _id: item.itemId,
        quantity: item.quantity,
        kind: item.kind,
        vendorId: foodItem.vendorId,
        vendorName: foodItem.vendorName || getVendorName(foodItem.vendorId)
      }));

      setCartItems(formattedCartItems);

      // If cart becomes empty, reset current vendor
      if (formattedCartItems.length === 0) {
        setCurrentVendorId(null);
      }

      notifyCartCountChanged({
        count: sumCartQuantities(formattedCartItems),
        userId: user._id,
      });
      toast.info(`Decreased quantity of ${foodItem.name}`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to decrease quantity");
      }
    }
  };

  const getVendorName = (vendorId: string) => {
    if (!vendorId) {
      return "Unknown Vendor";
    }
    const vendorName = vendors[vendorId];
    if (!vendorName) {
      return "Unknown Vendor";
    }
    return vendorName;
  };

  return (
    <div className={styles.container}>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className={styles.header}>
        <h1>Your Favorites</h1>
      </div>

      <div className={styles.dropdownContainer} ref={dropdownRef}>
        <div className={styles.collegeField}>
          <input
            name="college"
            value={selectedCollege ? selectedCollege.fullName : ""}
            readOnly
            placeholder="Select your college"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          <FaChevronDown
            className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.open : ''}`}
          />
          <ul className={`${styles.collegeList} ${isDropdownOpen ? styles.show : ''}`}>
            <li onClick={() => handleCollegeSelect(null)}>
              All Colleges
            </li>
            {colleges.map((college) => (
              <li
                key={college._id}
                onClick={() => handleCollegeSelect(college)}
              >
                {college.fullName}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.collegeHeader}>
          <h2 className={styles.collegeName}>
            {selectedCollege ? selectedCollege.fullName : "All Colleges"}
          </h2>
          <p className={styles.subTitle}>Your Favorites</p>
        </div>

        {loading ? (
          null
        ) : favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>Oops! You have no favorites yet</h2>
            <p>Start adding your favorite items to see them here!</p>
            <button
              className={styles.homeButton}
              onClick={() => router.push('/')}
            >
              Go to Home
            </button>
          </div>
        ) : (
          <div className={styles.itemsGrid}>
            {favorites.map((food) => {
              const favKey = `${food._id}-${food.vendorId}`;
              const isFavorited = favoriteIds.includes(favKey);

              // Find the cart item with matching itemId and vendorId
              const matchingCartItem = cartItems.find(item =>
                item._id === food._id && item.vendorId === food.vendorId
              );

              const quantity = matchingCartItem?.quantity || 0;
              const homeFoodItem = convertItemToHomeFoodItem(food);

              return (
                <DishListItem
                  key={favKey}
                  item={homeFoodItem}
                  quantity={quantity}
                  isFavorite={isFavorited}
                  onAdd={() => handleAddToCart(food)}
                  onIncrease={() => handleIncreaseQuantity(food)}
                  onDecrease={() => handleDecreaseQuantity(food)}
                  onToggleFavorite={() => handleToggleFavorite(food)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FavouriteFoodPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        null
      }
    >
      <FavouriteFoodPageContent />
    </Suspense>
  );
};

export default FavouriteFoodPage;
