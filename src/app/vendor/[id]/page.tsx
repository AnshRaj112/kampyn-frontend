"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import DishListItem from "@/app/components/food/DishListItem/DishListItemV2";
import SearchBar from "@/app/components/search/SearchBar/SearchBar";
import styles from "./styles/VendorPage.module.scss";
import { addToCart, increaseQuantity, decreaseQuantity } from "./utils/cartUtils";
import { toast } from "react-toastify";
import api from "@/utils/apiUtils";
import { FoodItem } from "@/app/food/[slug]/types";


interface VendorItem {
  itemId: string;
  name: string;
  description?: string;
  type?: string;
  subtype?: string;
  price: number;
  image?: string;
  quantity?: number;
  isAvailable?: string;
  vendorId?: string;
  isVeg?: boolean | string;
  category?: "retail" | "produce";
}

interface VendorData {
  success: boolean;
  foodCourtName: string;
  image?: string;
  coverImage?: string;
  data: {
    retailItems: VendorItem[];
    produceItems: VendorItem[];
  };
  uniID?: string;
}

interface UserData {
  _id: string;
  cart: Array<{
    itemId: string;
    kind: string;
    quantity: number;
  }>;
  favourites?: Array<{
    itemId: string;
    vendorId: string;
    kind: string;
  }>;
}

interface Favourite {
  itemId: string;
  vendorId: string;
  kind: string;
}

const VendorPage = () => {
  const { id } = useParams();

  // Helper to map VendorItem to FoodItem for DishListItemV2
  const mapToFoodItem = (item: VendorItem) => {
    // Inventory kind lives on category (retail/produce). `item.type` is menu group (Beverage, etc.).
    const inventoryCategory =
      item.category === "produce" || item.category === "retail"
        ? item.category
        : item.type === "produce" || item.type === "Produce"
          ? "produce"
          : item.type === "retail" || item.type === "Retail"
            ? "retail"
            : "retail";

    return {
      id: item.itemId,
      title: item.name,
      description: item.description,
      image: item.image || '/images/placeholder_food.jpg',
      category: inventoryCategory,
      type: inventoryCategory === item.type ? inventoryCategory : (item.type || inventoryCategory),
      subtype: item.subtype,
      isSpecial: 'N', // Default
      price: item.price,
      vendorId: item.vendorId || (id as string),
      quantity: item.quantity,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg
    };
  };
  console.log('[DEBUG] useParams id:', id, 'type:', typeof id);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [universityId, setUniversityId] = useState<string>("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<VendorItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Sort order state
  const [typeOrder, setTypeOrder] = useState<Array<{ category: string; type: string; sortIndex: number }>>([]);
  const [subtypeOrder, setSubtypeOrder] = useState<Array<{ category: string; type: string; subtype: string; sortIndex: number }>>([]);

  // Filter states
  const [vegFilter, setVegFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "retail" | "produce">("all");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);

  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  // Helper to get the real vendorId from the item or fallback to route id
  const getRealVendorId = (item: VendorItem) => {
    return item.vendorId ? String(item.vendorId).trim() : String(id).trim();
  };

  // Get the current vendor's ObjectId from the first item (retail or produce)
  const currentVendorId = vendorData?.data?.retailItems?.[0]?.vendorId || vendorData?.data?.produceItems?.[0]?.vendorId || id;

  // Helper to check if an item is favourited by the user for this vendor
  const isItemFavourited = (item: VendorItem) => {
    if (!userData?.favourites) return false;
    return userData.favourites.some(
      (fav: Favourite) =>
        String(fav.itemId) === String(item.itemId) &&
        String(fav.vendorId) === String(currentVendorId) &&
        fav.kind === (item.category === "retail" ? "Retail" : "Produce")
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendor data
        const vendorResponse = await api.get(`/api/item/getvendors/${id}`);
        const vendorData = vendorResponse.data;
        if (vendorData.success) {
          // Add category information to items (preserve original type field)
          let retailItems = vendorData.data.retailItems.map((item: VendorItem) => ({
            ...item,
            category: "retail" as const
          }));
          let produceItems = vendorData.data.produceItems.map((item: VendorItem) => ({
            ...item,
            category: "produce" as const
          }));

          // Fetch sort order (vendor-specific first, then university-wide)
          if (vendorData.uniID) {
            setUniversityId(vendorData.uniID);

            try {
              // Try vendor-specific sort order first
              let sortRes = await api.get(
                `/api/menu-sort/order?uniId=${vendorData.uniID}&vendorId=${id}`
              );
              let sortData = null;

              if (sortRes.status === 200) {
                sortData = sortRes.data;
              }

              // If vendor-specific doesn't exist or failed, try university-wide
              if (!sortData || !sortData.success) {
                sortRes = await api.get(
                  `/api/menu-sort/order?uniId=${vendorData.uniID}&vendorId=null`
                );
                if (sortRes.status === 200) {
                  sortData = sortRes.data;
                }
              }

              if (sortData && sortData.success && sortData.data) {
                // Store type and subtype order for later use
                if (sortData.data.typeOrder) {
                  setTypeOrder(sortData.data.typeOrder);
                }
                if (sortData.data.subtypeOrder) {
                  setSubtypeOrder(sortData.data.subtypeOrder);
                }

                // Apply item sort order
                if (sortData.data.itemOrder) {
                  const sortMap = new Map<string, number>();
                  sortData.data.itemOrder.forEach((item: { itemId: string; sortIndex: number }) => {
                    sortMap.set(item.itemId, item.sortIndex);
                  });

                  // Apply sort order to retail items
                  if (sortMap.size > 0) {
                    retailItems = retailItems.sort((a: VendorItem, b: VendorItem) => {
                      const aIndex = sortMap.get(a.itemId);
                      const bIndex = sortMap.get(b.itemId);
                      if (aIndex !== undefined && bIndex !== undefined) {
                        return aIndex - bIndex;
                      }
                      if (aIndex !== undefined) return -1;
                      if (bIndex !== undefined) return 1;
                      return a.name.localeCompare(b.name);
                    });

                    // Apply sort order to produce items
                    produceItems = produceItems.sort((a: VendorItem, b: VendorItem) => {
                      const aIndex = sortMap.get(a.itemId);
                      const bIndex = sortMap.get(b.itemId);
                      if (aIndex !== undefined && bIndex !== undefined) {
                        return aIndex - bIndex;
                      }
                      if (aIndex !== undefined) return -1;
                      if (bIndex !== undefined) return 1;
                      return a.name.localeCompare(b.name);
                    });
                  }
                } else {
                  // If no item order, sort alphabetically
                  retailItems.sort((a: VendorItem, b: VendorItem) => a.name.localeCompare(b.name));
                  produceItems.sort((a: VendorItem, b: VendorItem) => a.name.localeCompare(b.name));
                }
              } else {
                // If no sort order at all, sort alphabetically
                retailItems.sort((a: VendorItem, b: VendorItem) => a.name.localeCompare(b.name));
                produceItems.sort((a: VendorItem, b: VendorItem) => a.name.localeCompare(b.name));
              }
            } catch (err) {
              console.error("Error fetching sort order:", err);
              // Continue without sort order if it fails
            }
          }

          setVendorData({
            ...vendorData,
            data: {
              retailItems,
              produceItems
            }
          });
        }

        // Fetch user data (student cart requires /api/user/auth/user — university/tenant tokens won't work)
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const userResponse = await api.get("/api/user/auth/user");
            if (userResponse.status === 200 && userResponse.data?._id) {
              setUserData(userResponse.data);
            }
          } catch (userErr) {
            console.warn("Student session not available for cart (login as a student user):", userErr);
            setUserData(null);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleFavourite = async (item: VendorItem | FoodItem) => {
    if (!userData) {
      toast.error("Please login to favourite items");
      return;
    }
    const itemId = "itemId" in item ? item.itemId : item.id;
    const category = item.category;
    const kind = category === "retail" ? "Retail" : "Produce";

    try {
      const res = await api.patch(`/fav/${userData._id}/${itemId}/${kind}/${getRealVendorId(item as VendorItem)}`);
      const data = res.data;
      if (res.status !== 200) {
        toast.error(data.error || "Failed to update favourites");
      } else {
        toast.success(data.message || "Favourites updated.");
        // Optionally, you can refresh userData here to get updated favourites
        const token = localStorage.getItem("token");
        if (token) {
          const userResponse = await api.get("/api/user/auth/user");
          if (userResponse.status === 200) {
            const updatedUserData = userResponse.data;
            setUserData(updatedUserData);
          }
        }
      }
    } catch (err) {
      console.error("Favourite toggle error:", err);
      toast.error("Error updating favourites");
    }
  };


  const allItems = [
    ...(vendorData?.data.retailItems || []),
    ...(vendorData?.data.produceItems || [])
  ];

  // Create type order map (needed for sorting) - only include types that exist in vendor items
  const typeOrderMap = new Map<string, number>();
  const vendorTypeSet = new Set<string>();

  // First, collect all types that actually exist in the vendor's items
  allItems.forEach(item => {
    if (item.type) {
      vendorTypeSet.add(`${item.category || "retail"}-${item.type}`);
    }
  });

  // Only add types to the map if they exist in the vendor's items
  typeOrder.forEach((item) => {
    const key = `${item.category}-${item.type}`;
    if (vendorTypeSet.has(key)) {
      typeOrderMap.set(key, item.sortIndex);
    }
  });

  // Create subtype order map (needed for sorting) - only include subtypes that exist in vendor items
  const subtypeOrderMap = new Map<string, number>();
  const vendorSubtypeSet = new Set<string>();

  // First, collect all subtypes that actually exist in the vendor's items
  allItems.forEach(item => {
    if (item.type && item.subtype) {
      vendorSubtypeSet.add(`${item.category || "retail"}-${item.type}-${item.subtype}`);
    }
  });

  // Only add subtypes to the map if they exist in the vendor's items
  subtypeOrder.forEach((item) => {
    const key = `${item.category}-${item.type}-${item.subtype}`;
    if (vendorSubtypeSet.has(key)) {
      subtypeOrderMap.set(key, item.sortIndex);
    }
  });

  // Get unique types and subtypes for filters, sorted by type order
  // Only show types that actually exist in the vendor's items
  const uniqueTypes = Array.from(
    new Set(
      allItems
        .map(item => item.type)
        .filter((type): type is string => Boolean(type))
    )
  ).sort((a, b) => {
    // Try to get category for each type
    const typeAItems = allItems.filter(item => item.type === a);
    const typeBItems = allItems.filter(item => item.type === b);
    const categoryA = typeAItems[0]?.category || "retail";
    const categoryB = typeBItems[0]?.category || "retail";

    // Get sort indices (only if type exists in vendor items)
    const aKey = `${categoryA}-${a}`;
    const bKey = `${categoryB}-${b}`;
    const aIndex = typeOrderMap.get(aKey);
    const bIndex = typeOrderMap.get(bKey);

    if (aIndex !== undefined && bIndex !== undefined) {
      return aIndex - bIndex;
    }
    if (aIndex !== undefined) return -1;
    if (bIndex !== undefined) return 1;
    return a.localeCompare(b);
  });

  // Get unique subtypes for the selected type, sorted by subtype order
  // Only show subtypes that actually exist in the vendor's items for that type
  const uniqueSubtypes = selectedType
    ? Array.from(
      new Set(
        allItems
          .filter(item => item.type === selectedType && item.subtype)
          .map(item => item.subtype)
          .filter((subtype): subtype is string => Boolean(subtype))
      )
    ).sort((a, b) => {
      // Try to get category for the selected type
      const typeItems = allItems.filter(item => item.type === selectedType);
      const category = typeItems[0]?.category || "retail";

      // Get sort indices (only if subtype exists in vendor items)
      const aKey = `${category}-${selectedType}-${a}`;
      const bKey = `${category}-${selectedType}-${b}`;
      const aIndex = subtypeOrderMap.get(aKey);
      const bIndex = subtypeOrderMap.get(bKey);

      if (aIndex !== undefined && bIndex !== undefined) {
        return aIndex - bIndex;
      }
      if (aIndex !== undefined) return -1;
      if (bIndex !== undefined) return 1;
      return a.localeCompare(b);
    })
    : [];

  // Comprehensive filtering logic
  const filteredItems = searchResults.length > 0 ? searchResults : allItems.filter(item => {
    // Veg/Non-veg filter
    const matchesVeg = vegFilter === "all" ||
      (vegFilter === "veg" && item.isVeg !== false) ||
      (vegFilter === "non-veg" && item.isVeg === false);

    // Category filter (retail/produce)
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

    // Type filter
    const matchesType = !selectedType || item.type === selectedType;

    // Subtype filter (only applies when a type is selected)
    const matchesSubtype = !selectedType || !selectedSubtype || item.subtype === selectedSubtype;

    return matchesVeg && matchesCategory && matchesType && matchesSubtype;
  });

  // Group items by type and subtype for organized display
  // Only group when not searching (search results should be flat)
  const groupedItems = isSearching ? {} : filteredItems.reduce((acc, item) => {
    const type = item.type || "Uncategorized";
    const subtype = item.subtype || "Other";

    if (!acc[type]) {
      acc[type] = {};
    }
    if (!acc[type][subtype]) {
      acc[type][subtype] = [];
    }
    acc[type][subtype].push(item);

    return acc;
  }, {} as Record<string, Record<string, VendorItem[]>>);

  // Sort types and subtypes (only when grouping)
  // Only include types that have items (groupedItems already filters to vendor's items)
  const sortedTypes = isSearching ? [] : Object.keys(groupedItems)
    .filter(type => {
      // Only include types that have at least one item
      const typeItems = Object.values(groupedItems[type]).flat();
      return typeItems.length > 0;
    })
    .sort((a, b) => {
      // Get category for type (check items to determine if retail or produce)
      // In vendor context, a type should only have items from one category
      const typeAItems = Object.values(groupedItems[a]).flat();
      const typeBItems = Object.values(groupedItems[b]).flat();
      const categoryA = typeAItems[0]?.category || "retail";
      const categoryB = typeBItems[0]?.category || "retail";

      // Try to get sort index for both types (only if they exist in vendor items)
      const aKey = `${categoryA}-${a}`;
      const bKey = `${categoryB}-${b}`;
      const aIndex = typeOrderMap.get(aKey);
      const bIndex = typeOrderMap.get(bKey);

      if (aIndex !== undefined && bIndex !== undefined) {
        return aIndex - bIndex;
      }
      if (aIndex !== undefined) return -1;
      if (bIndex !== undefined) return 1;
      return a.localeCompare(b);
    });

  // Sort subtypes within each type and ensure items maintain order
  // Only show subtypes that have items
  if (!isSearching) {
    sortedTypes.forEach(type => {
      const subtypes = groupedItems[type];
      const typeItems = Object.values(subtypes).flat();
      const category = typeItems[0]?.category || "retail";

      // Filter subtypes to only include those that have items, then sort
      const sortedSubtypes = Object.keys(subtypes)
        .filter(subtype => {
          // Only include subtypes that have at least one item
          return subtypes[subtype] && subtypes[subtype].length > 0;
        })
        .sort((a, b) => {
          // Put "Other" at the end
          if (a === "Other") return 1;
          if (b === "Other") return -1;

          // Only use sort order if subtype exists in vendor items
          const aKey = `${category}-${type}-${a}`;
          const bKey = `${category}-${type}-${b}`;
          const aIndex = subtypeOrderMap.get(aKey);
          const bIndex = subtypeOrderMap.get(bKey);

          if (aIndex !== undefined && bIndex !== undefined) {
            return aIndex - bIndex;
          }
          if (aIndex !== undefined) return -1;
          if (bIndex !== undefined) return 1;
          return a.localeCompare(b);
        });

      // Rebuild subtypes object in sorted order and ensure items are sorted
      const sortedSubtypeObj: Record<string, VendorItem[]> = {};
      sortedSubtypes.forEach(subtype => {
        // Items should already be sorted, but ensure they maintain order
        sortedSubtypeObj[subtype] = subtypes[subtype];
      });
      groupedItems[type] = sortedSubtypeObj;
    });
  }

  // Ensure items within filtered items maintain their sort order
  // Items are already sorted when fetched, but after filtering they should maintain relative order
  // Since we're using the already-sorted vendorData, the order should be preserved

  // Reset subtype when type is cleared or changed
  useEffect(() => {
    setSelectedSubtype(null);
  }, [selectedType]);

  const getItemQuantity = (itemId: string, category?: string) => {
    if (!userData?.cart) return 0;
    const kind = category === "retail" ? "Retail" : "Produce";
    const cartItem = userData.cart.find(
      item => item.itemId === itemId && item.kind === kind
    );
    return cartItem?.quantity || 0;
  };

  const handleAddToCart = async (item: VendorItem | FoodItem) => {
    if (!userData) {
      toast.error("Please login as a student to add items to cart");
      return;
    }

    const itemId = "itemId" in item ? item.itemId : item.id;
    // Prefer inventory category (retail/produce), not menu cuisine type
    const itemCategory =
      ("category" in item && (item.category === "retail" || item.category === "produce")
        ? item.category
        : item.category === "Retail"
          ? "retail"
          : item.category === "Produce"
            ? "produce"
            : null) ||
      (item.type === "retail" || item.type === "Retail"
        ? "retail"
        : item.type === "produce" || item.type === "Produce"
          ? "produce"
          : "retail");

    console.log('DEBUG: Adding item to cart:', {
      itemId: itemId,
      name: ("name" in item ? item.name : item.title),
      category: itemCategory,
      vendorId: id
    });

    if (!itemId) {
      toast.error("Invalid item — missing item id");
      return;
    }

    const quantity = getItemQuantity(itemId, itemCategory);

    if (loadingItemId) {
      // Don't soft-lock forever if a prior request hung — allow retry after warn
      console.warn("Add to cart ignored: another item is still loading", loadingItemId);
      toast.info("Still adding the previous item… try again in a moment");
      return;
    }

    const loadingTimeout = window.setTimeout(() => {
      setLoadingItemId((current) => {
        if (current === itemId) {
          console.warn("Clearing stuck cart loading state for", itemId);
          toast.error("Cart request timed out. Please try again.");
          return null;
        }
        return current;
      });
    }, 15000);

    try {
      setLoadingItemId(itemId);
      const normalizedItem = {
        ...item,
        itemId: itemId,
        category: itemCategory,
        type: itemCategory, // cartUtils kind resolution
        name: ("name" in item ? item.name : item.title)
      };

      const ok =
        quantity === 0
          ? await addToCart(userData._id, normalizedItem as unknown as VendorItem, id as string)
          : await increaseQuantity(userData._id, normalizedItem as unknown as VendorItem, id as string);

      if (!ok) {
        // cartUtils already toasted the error
        return;
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Failed to update cart");
    } finally {
      window.clearTimeout(loadingTimeout);
      setLoadingItemId(null);
    }

    // Refresh user data to update cart
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userResponse = await api.get("/api/user/auth/user");
        if (userResponse.status === 200 && userResponse.data?._id) {
          setUserData(userResponse.data);
        }
      } catch (err) {
        console.warn("Could not refresh student user after cart update", err);
      }
    }
  };

  const handleDecreaseQuantity = async (item: VendorItem | FoodItem) => {
    if (!userData || loadingItemId) return;

    const itemId = "itemId" in item ? item.itemId : item.id;
    const itemCategory = item.category || 'retail';

    try {
      setLoadingItemId(itemId);
      const normalizedItem = {
        ...item,
        itemId: itemId,
        category: itemCategory,
        name: ("name" in item ? item.name : item.title)
      };

      await decreaseQuantity(userData._id, normalizedItem as unknown as VendorItem, id as string);
    } catch (error) {
      console.error("Error decreasing quantity:", error);
    } finally {
      setLoadingItemId(null);
    }

    // Refresh user data to update cart
    const token = localStorage.getItem("token");
    if (token) {
      const userResponse = await api.get("/api/user/auth/user");
      if (userResponse.status === 200) {
        setUserData(userResponse.data);
      }
    }
  };


  const handleSearch = (results: VendorItem[]) => {
    console.log('DEBUG: Vendor page received search results:', results.map(item => ({
      itemId: item.itemId,
      name: item.name,
      type: item.type
    })));
    setIsSearching(true);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchResults([]);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Cover Image Banner */}
      {vendorData?.coverImage && (
        <div
          className={styles.coverImageBanner}
          style={{ backgroundImage: `url(${vendorData.coverImage})` }}
        >
          <div className={styles.coverOverlay} />
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.vendorHeaderContent} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {vendorData?.image && (
            <Image
              src={vendorData.image}
              alt={vendorData.foodCourtName}
              width={60}
              height={60}
              className={styles.vendorProfileImage}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          )}
          <h1 className={styles.vendorName}>{vendorData?.foodCourtName}</h1>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchBar}>
            <SearchBar
              hideUniversityDropdown={true}
              placeholder="Search food items..."
              vendorId={id as string}
              universityId={universityId}
              clearSearch={handleClearSearch}
              onSearchResults={handleSearch}
            />
          </div>
        </div>
      </div>

      {isSearching && (
        <button
          className={styles.clearSearchButton}
          onClick={handleClearSearch}
        >
          Clear Search
        </button>
      )}

      {!isSearching && (
        <div className={styles.filtersContainer}>
          {/* Veg/Non-veg Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Diet:</label>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${vegFilter === "all" ? styles.active : ''}`}
                onClick={() => setVegFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.filterButton} ${vegFilter === "veg" ? styles.active : ''}`}
                onClick={() => setVegFilter("veg")}
              >
                🟢 Veg
              </button>
              <button
                className={`${styles.filterButton} ${vegFilter === "non-veg" ? styles.active : ''}`}
                onClick={() => setVegFilter("non-veg")}
              >
                🔴 Non-Veg
              </button>
            </div>
          </div>

          {/* Category Filter (Retail/Produce) */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Category:</label>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${categoryFilter === "all" ? styles.active : ''}`}
                onClick={() => setCategoryFilter("all")}
              >
                All
              </button>
              <button
                className={`${styles.filterButton} ${categoryFilter === "retail" ? styles.active : ''}`}
                onClick={() => setCategoryFilter("retail")}
              >
                Retail
              </button>
              <button
                className={`${styles.filterButton} ${categoryFilter === "produce" ? styles.active : ''}`}
                onClick={() => setCategoryFilter("produce")}
              >
                Produce
              </button>
            </div>
          </div>

          {/* Type Filter */}
          {uniqueTypes.length > 0 && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Type:</label>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterButton} ${!selectedType ? styles.active : ''}`}
                  onClick={() => {
                    setSelectedType(null);
                    setSelectedSubtype(null);
                  }}
                >
                  All
                </button>
                {uniqueTypes.map(type => (
                  <button
                    key={type}
                    className={`${styles.filterButton} ${selectedType === type ? styles.active : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtype Filter (only shown when a type is selected) */}
          {selectedType && uniqueSubtypes.length > 0 && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Subtype:</label>
              <div className={styles.filterButtons}>
                <button
                  className={`${styles.filterButton} ${!selectedSubtype ? styles.active : ''}`}
                  onClick={() => setSelectedSubtype(null)}
                >
                  All
                </button>
                {uniqueSubtypes.map(subtype => (
                  <button
                    key={subtype}
                    className={`${styles.filterButton} ${selectedSubtype === subtype ? styles.active : ''}`}
                    onClick={() => setSelectedSubtype(subtype)}
                  >
                    {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.itemsContainer}>
        {filteredItems.length === 0 ? (
          <div className={styles.noResults}>
            {isSearching ? "No items found matching your search" : "No items available"}
          </div>
        ) : isSearching ? (
          // When searching, show items in a flat grid without grouping
          <div className={styles.itemsGrid}>
            {filteredItems.map(item => {
              const quantity = getItemQuantity(item.itemId, item.category);
              const isFav = isItemFavourited(item);
              const foodItem = mapToFoodItem(item);
              return (
                <DishListItem
                  key={item.itemId}
                  item={foodItem}
                  quantity={quantity}
                  isFavorite={isFav}
                  isLoading={loadingItemId === item.itemId}
                  onAdd={handleAddToCart}
                  onIncrease={handleAddToCart}
                  onDecrease={handleDecreaseQuantity}
                  onToggleFavorite={toggleFavourite}
                />
              );
            })}
          </div>
        ) : (
          // When not searching, show items organized by type and subtype
          sortedTypes.map(type => {
            const subtypes = groupedItems[type];
            return (
              <div key={type} className={styles.typeSection}>
                <h2 className={styles.typeHeader}>{type}</h2>
                {Object.entries(subtypes).map(([subtype, items]) => (
                  <div key={`${type}-${subtype}`} className={styles.subtypeSection}>
                    {subtype !== "Other" && (
                      <h3 className={styles.subtypeHeader}>{subtype}</h3>
                    )}
                    <div className={styles.itemsGrid}>
                      {items.map(item => {
                        const quantity = getItemQuantity(item.itemId, item.category);
                        const isFav = isItemFavourited(item);
                        console.log('[DEBUG] UI itemId:', item.itemId, 'UI vendorId:', getRealVendorId(item), 'isFav:', isFav);
                        const foodItem = mapToFoodItem(item);
                        return (
                          <DishListItem
                            key={item.itemId}
                            item={foodItem}
                            quantity={quantity}
                            isFavorite={isFav}
                            isLoading={loadingItemId === item.itemId}
                            onAdd={handleAddToCart}
                            onIncrease={handleAddToCart}
                            onDecrease={handleDecreaseQuantity}
                            onToggleFavorite={toggleFavourite}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div >
  );
};

export default VendorPage; 