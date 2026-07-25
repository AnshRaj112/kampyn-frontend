"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Store, ArrowLeft, ChevronDown } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./styles/global.css";
import styles from "./styles/CollegePage.module.scss";
import { useEffect, useRef, useState, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CartProvider, useCart } from "./context/CartContext";
import {
  FoodItem,
  FavoriteItem,
  College,
  ApiFavoritesResponse,
  Vendor as VendorType,
  CollegeVendor,
} from "./types";
import Image from "next/image";
import DishListItem from "@/app/components/food/DishListItem/DishListItemV2";

import { toast } from "react-toastify";
import VendorModal from "./components/VendorModal";
import FavoritesSection from "./components/FavoritesSection";
import { VendorSkeleton, CategorySkeleton } from "@/app/components/skeleton/SkeletonLoader/SkeletonLoader";
import api from "@/utils/apiUtils";

// Categories will be dynamically generated from fetched items

// Normalize college name for matching
const normalizeName = (name: string) =>
  name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace any non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, "") || ""; // Remove leading and trailing hyphens

const CollegePageContent = ({ slug = "", userIdProp }: { slug?: string, userIdProp: string | null }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  console.log('Original slug:', slug);
  console.log('Slug type:', typeof slug);
  console.log('Slug length:', slug.length);

  // Use passed userId
  const [userId, setUserId] = useState<string | null>(userIdProp);

  // Sync prop userId to state if needed, or just use prop.
  // Existing logic uses userId state. Let's sync it.
  useEffect(() => {
    if (userIdProp !== undefined) setUserId(userIdProp);
  }, [userIdProp]);

  const formatCollegeName = (name: string) => {
    if (!name) return '';
    console.log('Formatting name:', name);
    // Split by hyphens and capitalize each word
    const formatted = name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    console.log('Formatted result:', formatted);
    return formatted;
  };

  // Get college name from URL path
  const getCollegeNameFromPath = () => {
    const parts = pathname.split('/');
    const collegeSlug = parts[parts.length - 1];
    console.log('College slug from path:', collegeSlug);
    return collegeSlug;
  };

  const collegeName = formatCollegeName(getCollegeNameFromPath());

  const [uniId, setUniId] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>("");
  const [items, setItems] = useState<{ [key: string]: FoodItem[] }>({});
  const [userFavorites, setUserFavorites] = useState<FavoriteItem[]>([]);
  const [categories, setCategories] = useState<{ retail: string[]; produce: string[] }>({ retail: [], produce: [] });
  // const [categorySubtypes, setCategorySubtypes] = useState<{ [key: string]: string[] }>({});

  const [vendors, setVendors] = useState<CollegeVendor[]>([]);
  // New State for Progressive Disclosure
  const [collegeImages, setCollegeImages] = useState<{
    retail?: string;
    produce?: string;
    categories?: { name: string; image: string }[]
  }>({});
  const [selectedCategory, setSelectedCategory] = useState<'retail' | 'produce' | null>(null);
  const [selectedKind, setSelectedKind] = useState<string | null>(null); // e.g., 'Pizza', 'Fruits'
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [subtypeFilter, setSubtypeFilter] = useState<string>('all');

  // Vendor Modal State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<FoodItem | null>(null);
  const [modalSelectedVendor, setModalSelectedVendor] = useState<VendorType | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [confirmedVendorId, setConfirmedVendorId] = useState<string | null>(null);
  const [showSubtypeDropdown, setShowSubtypeDropdown] = useState(false);
  const subtypeDropdownRef = useRef<HTMLDivElement>(null);

  // Cart Context
  const { cartItems, addItemToCart, increaseItemQuantity, decreaseItemQuantity } = useCart();

  useEffect(() => {
    if (cartItems.length > 0) {
      // Assuming single vendor policy, take the vendor from the first item
      setConfirmedVendorId(cartItems[0].vendorId);
    } else {
      setConfirmedVendorId(null);
    }
  }, [cartItems]);

  // State to hold valid vendors for the modal
  const [itemVendors, setItemVendors] = useState<VendorType[]>([]);
  // const [loadingItemId, setLoadingItemId] = useState<string | null>(null); // Moved up

  // Loading states for sections
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  const currentRequest = useRef<number>(0);

  // Update URL with college ID
  const updateUrlWithCollegeId = useCallback((collegeId: string) => {
    const currentPath = window.location.pathname;
    const newUrl = `${currentPath}?cid=${collegeId}`;
    window.history.replaceState({}, "", newUrl);
  }, []);

  // Click outside handler for subtype dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subtypeDropdownRef.current && !subtypeDropdownRef.current.contains(event.target as Node)) {
        setShowSubtypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get college list and match collegeName to get actual college id
  const fetchCollegesAndSetUniId = useCallback(async (collegeSlug: string) => {
    try {
      const response = await api.get("/api/user/auth/list");
      const colleges = response.data as College[];

      // Normalize the input slug
      const normalizedSlug = normalizeName(collegeSlug);

      // Find the college that matches the normalized slug
      const matchedCollege = colleges.find((college) => {
        const normalizedCollegeName = normalizeName(college.fullName);
        return normalizedCollegeName === normalizedSlug;
      });

      if (matchedCollege) {
        setUniId(matchedCollege._id);
        setCollegeImages({
          retail: matchedCollege.retailImage,
          produce: matchedCollege.produceImage,
          categories: matchedCollege.categoryImages
        });
        localStorage.setItem("currentCollegeId", matchedCollege._id);
        const resolvedSlug = matchedCollege.slug || normalizeName(matchedCollege.fullName);
        localStorage.setItem("currentTenantSlug", resolvedSlug);
        updateUrlWithCollegeId(matchedCollege._id);
        return true;
      } else {
        // College not found - just log it
        if (colleges.length > 0) {
          console.warn(`College not found: ${collegeSlug}`);
        }
        return false;
      }
    } catch (err) {
      console.error("Error fetching colleges:", err);
      return false;
    }
  }, [updateUrlWithCollegeId]);

  // Extract cid from searchParams for stable dependency
  const cid = searchParams.get("cid");

  // On load, determine uniId from multiple sources:
  useEffect(() => {
    let isMounted = true;

    const resolveCollegeId = async () => {
      const localCollegeId = localStorage.getItem("currentCollegeId");

      if (cid) {
        if (cid.length < 10) {
          try {
            const response = await api.get("/api/user/auth/list");
            const colleges = response.data as College[];
            const found = colleges.find((c) => c._id.startsWith(cid));
            if (found && isMounted) {
              setUniId(found._id);
              setCollegeImages({
                retail: found.retailImage,
                produce: found.produceImage,
                categories: found.categoryImages
              });
              localStorage.setItem("currentCollegeId", found._id);
              const resolvedSlug = found.slug || normalizeName(found.fullName);
              localStorage.setItem("currentTenantSlug", resolvedSlug);
              updateUrlWithCollegeId(found._id);
              return;
            }
          } catch (err) {
            console.error("Error matching shortened CID:", err);
          }
        } else {
          if (isMounted) {
            setUniId(cid);
            localStorage.setItem("currentCollegeId", cid);
            updateUrlWithCollegeId(cid);
            
            const pathname = window.location.pathname.toLowerCase();
            const pathParts = pathname.split('/');
            if (pathParts[1] === 'food' && pathParts[2]) {
              localStorage.setItem("currentTenantSlug", pathParts[2]);
            }
          }
          return;
        }
      }

      if (slug) {
        const success = await fetchCollegesAndSetUniId(slug);
        if (success) return;
      }

      if (localCollegeId && isMounted) {
        setUniId(localCollegeId);
        updateUrlWithCollegeId(localCollegeId);
      }
    };

    resolveCollegeId();

    return () => {
      isMounted = false;
    };
  }, [slug, cid, fetchCollegesAndSetUniId, updateUrlWithCollegeId]);

  // Fetch full university profile to get latest images
  useEffect(() => {
    if (!uniId) return;

    const fetchUniProfile = async () => {
      try {
        const response = await api.get(`/api/university/${uniId}/profile`);
        if (response.data) {
          const data = response.data;
          setCollegeImages({
            retail: data.retailImage,
            produce: data.produceImage,
            categories: data.categoryImages
          });
        }
      } catch (error) {
        console.error("Error fetching university profile:", error);
      }
    };

    fetchUniProfile();
  }, [uniId]);

  // Helper to find category image with fuzzy matching
  const findCategoryImage = (categoryName: string) => {
    if (!collegeImages.categories) return null;

    // Normalize string for comparison (lowercase, trim, remove special chars)
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = normalize(categoryName);

    // 1. Exact match
    const exact = collegeImages.categories.find(c => c.name === categoryName);
    if (exact) return exact.image;

    // 2. Case-insensitive match
    const caseInsensitive = collegeImages.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (caseInsensitive) return caseInsensitive.image;

    // 3. Fuzzy match (normalized)
    const fuzzy = collegeImages.categories.find(c => normalize(c.name) === target);
    if (fuzzy) return fuzzy.image;

    return null;
  };

  // Fetch user & favorites
  useEffect(() => {
    const fetchUserAndFavorites = async () => {
      try {
        // Tokens are now handled via HTTP-only cookies
        // If we want to check if the user is potentially logged in without an API call, 
        // we can still use a non-sensitive flag in localStorage if needed, 
        // but for now we'll just try to fetch the user.

        // Fetch user data
        const userResponse = await api.get("/api/user/auth/user");
        const userData = userResponse.data;
        setUserFullName(userData.fullName);
        setUserId(userData._id); // Ensure state is synced with fetched user

        if (uniId) {
          // Fetch favorites using the new API endpoint
          const favoritesResponse = await api.get(`/fav/${userData._id}/${uniId}`);
          const favoritesData = favoritesResponse.data as ApiFavoritesResponse;
          setUserFavorites(favoritesData.favourites);
        }
      } catch (err) {
        console.error("Error fetching user or favorites:", err);
        setUserFavorites([]);
      } finally {
        setIsLoadingFavorites(false);
      }
    };
    fetchUserAndFavorites();
  }, [uniId]);

  // Fetch Vendors
  useEffect(() => {
    if (!uniId) return;
    const getVendors = async () => {
      try {
        const response = await api.get(`/api/vendor/list/uni/${uniId}`);
        if (response.data) {
          const sellerOnlyVendors = (response.data as CollegeVendor[]).filter(
            (vendor) => vendor.sellerType !== "NON_SELLER"
          );
          setVendors(sellerOnlyVendors);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
      } finally {
        setIsLoadingVendors(false);
      }
    };
    getVendors();
  }, [uniId]);

  // Fetch food items for given uniId and categories
  useEffect(() => {
    if (!uniId) {
      console.log('No uniId available, skipping item fetch');
      return;
    }

    console.log('Fetching items for uniId:', uniId);
    const requestId = ++currentRequest.current;

    const fetchItems = async () => {

      const allItems: { [key: string]: FoodItem[] } = {};

      try {
        // Fetch all retail and produce items for the university (like uniDashboard)
        const [retailRes, produceRes] = await Promise.all([
          api.get(`/api/item/retail/uni/${uniId}?limit=1000`),
          api.get(`/api/item/produce/uni/${uniId}?limit=1000`),
        ]);

        const retailData = retailRes.data || { items: [] };
        const produceData = produceRes.data || { items: [] };

        const retailItems: FoodItem[] = (retailData.items || []).map((item: Record<string, unknown>) => ({
          id: item._id as string,
          title: item.name as string,
          description: item.description as string | undefined,
          image: item.image as string,
          category: item.type as string,
          type: 'retail',
          subtype: item.subtype as string | undefined,
          isSpecial: item.isSpecial as string,
          collegeId: uniId,
          price: item.price as number,
          vendorId: (item.vendorId as string) || null,
          quantity: item.quantity as number,
          isVeg: item.isVeg !== undefined ? (item.isVeg as boolean) : true,
        }));

        const produceItems: FoodItem[] = (produceData.items || []).map((item: Record<string, unknown>) => ({
          id: item._id as string,
          title: item.name as string,
          description: item.description as string | undefined,
          image: item.image as string,
          category: item.type as string,
          type: 'produce',
          subtype: item.subtype as string | undefined,
          isSpecial: item.isSpecial as string,
          collegeId: uniId,
          price: item.price as number,
          vendorId: (item.vendorId as string) || null,
          isAvailable: item.isAvailable as string,
          isVeg: item.isVeg !== undefined ? (item.isVeg as boolean) : true,
        }));

        // Sort items alphabetically by title
        retailItems.sort((a, b) => a.title.localeCompare(b.title));
        produceItems.sort((a, b) => a.title.localeCompare(b.title));

        // Group by category-type and subtype when subtype exists
        [...retailItems, ...produceItems].forEach(item => {
          // Group by type-category
          const key = `${item.type}-${item.category}`; // e.g. retail-Pizza
          if (!allItems[key]) allItems[key] = [];
          allItems[key].push(item);
        });

        // Generate Categories
        const retailTypes = new Set<string>();
        const produceTypes = new Set<string>();
        retailItems.forEach(item => {
          if (item.category) retailTypes.add(item.category);
        });
        produceItems.forEach(item => {
          if (item.category) produceTypes.add(item.category);
        });

        const sortedRetailTypes = Array.from(retailTypes).sort();
        const sortedProduceTypes = Array.from(produceTypes).sort();

        setCategories({
          retail: sortedRetailTypes,
          produce: sortedProduceTypes,
        });

        if (requestId === currentRequest.current) {
          setItems(allItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        if (requestId === currentRequest.current) {
          setItems({});
          setCategories({ retail: [], produce: [] });
        }
      } finally {
        if (requestId === currentRequest.current) {
          setIsLoadingItems(false);
        }
      }
    };

    fetchItems();
  }, [uniId]);

  const convertFavoriteToFoodItem = (item: FavoriteItem): FoodItem => {
    // Attempt to find full item details from the items state for enrichment
    let fullItem: FoodItem | undefined;
    for (const key in items) {
      const found = items[key].find(i => i.id === item._id);
      if (found) {
        fullItem = found;
        break;
      }
    }

    const isRetail = item.type === 'retail';
    const vendor = vendors.find(v => v._id === item.vendorId);

    let isAvailable = 'N';
    let qty = 0;

    if (vendor) {
      if (isRetail) {
        const inv = vendor.retailInventory?.find(i => i.itemId === item._id);
        if (inv && inv.quantity > 0) {
          isAvailable = 'Y';
          qty = inv.quantity;
        }
      } else {
        const inv = vendor.produceInventory?.find(i => i.itemId === item._id);
        if (inv && (inv.isAvailable === 'Y' || inv.isAvailable === 'y')) {
          isAvailable = 'Y';
          qty = 1; // Produce doesn't have numerical quantity, use 1 if available
        }
      }
    }

    return {
      id: item._id,
      title: item.name,
      description: fullItem?.description || "",
      image: item.image,
      category: item.kind,
      type: item.type,
      subtype: item.subtype,
      isSpecial: item.isSpecial,
      price: item.price,
      vendorId: item.vendorId,
      isVeg: fullItem?.isVeg ?? true,
      isAvailable,
      quantity: qty
    };
  };






  // --- Render Helpers ---

  const renderVendorList = () => (
    <div className={styles.sectionContainer}>
      <h2 className={styles.sectionTitle}>Available Vendors</h2>
      {isLoadingVendors ? (
        <VendorSkeleton />
      ) : (
        <div className={styles.vendorGrid}>
          {vendors.map((vendor) => (
            <div
              key={vendor._id}
              className={styles.vendorCard}
              data-theme-component="card.vendor"
              onClick={() => router.push(`/vendor/${vendor._id}`)}
            >
              <div className={styles.vendorImagePlaceholder}>
                {vendor.image ? (
                  <Image
                    src={vendor.image}
                    alt={vendor.fullName}
                    fill
                    style={{ objectFit: 'cover' }}
                    className={styles.vendorImage}
                  />
                ) : (
                  <Store size={40} color="var(--kampyn-color-secondary, #4ea199)" />
                )}
              </div>
              <div className={styles.vendorInfo}>
                <h3 className={styles.vendorName}>{vendor.fullName}</h3>
                <button className={styles.checkMenuBtn}> Check menu</button>
                {vendor.isAvailable === 'N' && <span className={styles.unavailableBadge}>Unavailable</span>}
              </div>
            </div>
          ))}
          {vendors.length === 0 && <p>No vendors available at the moment.</p>}
        </div>
      )}
    </div>
  );

  const renderCategorySelection = () => {
    const showRetail = categories.retail.length > 0;
    const showProduce = categories.produce.length > 0;

    if (isLoadingItems) {
      return (
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Explore Food Options</h2>
          <CategorySkeleton />
        </div>
      );
    }

    if (!showRetail && !showProduce) {
      return (
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Explore Food Options</h2>
          <p>No food items available at the moment.</p>
        </div>
      );
    }

    // Use college-specific images if available, otherwise fallback to static placeholders
    const retailImage = collegeImages.retail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000';
    const produceImage = collegeImages.produce || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=1000';

    return (
      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Explore Food Options</h2>
        <div className={styles.categoryToggleGrid}>
          {showRetail && (
            <div
              className={`${styles.categoryToggleCard} ${selectedCategory === 'retail' ? styles.active : ''}`}
              onClick={() => { setSelectedCategory('retail'); setSelectedKind(null); }}
            >
              <div className={styles.categoryImageWrapper}>
                <Image
                  src={retailImage}
                  alt="Retail"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.categoryOverlay} />
                <span className={styles.categoryLabel}>Retail</span>
              </div>
            </div>
          )}
          {showProduce && (
            <div
              className={`${styles.categoryToggleCard} ${selectedCategory === 'produce' ? styles.active : ''}`}
              onClick={() => { setSelectedCategory('produce'); setSelectedKind(null); }}
            >
              <div className={styles.categoryImageWrapper}>
                <Image
                  src={produceImage}
                  alt="Produce"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className={styles.categoryOverlay} />
                <span className={styles.categoryLabel}>Produce</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderKindSelection = () => {
    const kinds = selectedCategory === 'retail' ? categories.retail : categories.produce;

    return (
      <div className={styles.sectionContainer}>
        <div className={styles.headerRow}>
          <button className={styles.backButton} onClick={() => setSelectedCategory(null)}>
            <ArrowLeft size={20} /> Back
          </button>
          <h2 className={styles.sectionTitle}>
            {selectedCategory === 'retail' ? 'Retail Categories' : 'Produce Categories'}
          </h2>
        </div>

        <div className={styles.kindsGrid}>
          {kinds.map(kind => {
            // Find a representative image
            const key = `${selectedCategory}-${kind}`;
            const paramsItems = items[key] || [];

            // Priority: 1. Uni assigned image (fuzzy matched), 2. First item image, 3. Placeholder
            const assignedImage = findCategoryImage(kind);
            const image = assignedImage || paramsItems[0]?.image || '/images/placeholder_food.jpg';

            return (
              <div
                key={kind}
                className={styles.kindCard}
                onClick={() => setSelectedKind(kind)}
              >
                <div className={styles.kindImageWrapper}>
                  <Image
                    src={image}
                    alt={kind}
                    fill
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      // fallback behavior if needed, generally handled by Image component or placeholder logic
                      (e.target as HTMLImageElement).src = '/images/placeholder_food.jpg';
                    }}
                  />
                  <div className={styles.kindOverlay} />
                  <h3 className={styles.kindTitle}>{kind}</h3>
                </div>
              </div>
            );
          })}
          {kinds.length === 0 && <p>No categories found.</p>}
        </div>
      </div>
    );
  };

  // Guard double-clicks without blocking vendor-confirm after modal open
  const addingInFlightRef = useRef(false);

  const executeAddToCart = async (item: FoodItem, vendorId: string) => {
    if (!userId) {
      toast.error("Please login first");
      return;
    }
    if (addingInFlightRef.current) return;
    addingInFlightRef.current = true;
    setLoadingItemId(item.id);
    try {
      await addItemToCart(item, { _id: vendorId, name: '', price: 0 });
    } catch (e) {
      console.error(e);
      toast.error("Failed to add to cart");
    } finally {
      addingInFlightRef.current = false;
      setLoadingItemId(null);
    }
  };

  const handleAddToCart = async (item: FoodItem) => {
    if (!userId) {
      toast.error("Please login first");
      return;
    }

    if (addingInFlightRef.current || loadingItemId) return;

    try {
      // If item already has a specific vendorId (from favorites)
      if (item.vendorId) {
        // Enforce single-vendor cart policy
        if (confirmedVendorId && confirmedVendorId !== item.vendorId) {
          const errorVendor = vendors.find(v => v._id === confirmedVendorId);
          const vendorName = errorVendor ? errorVendor.fullName : "your current vendor";
          toast.error(`Food item is only available in ${vendorName} for your current cart`);
          return;
        }

        // Check if item is available in this specific vendor
        setLoadingItemId(item.id);
        const response = await api.get(`/api/item/vendors/${item.id}`);
        const fetchedVendors: VendorType[] = response.data;
        const vendor = fetchedVendors?.find(v => v._id === item.vendorId);

        if (vendor) {
          await executeAddToCart(item, item.vendorId);
          return;
        } else {
          toast.error("This item is currently unavailable from your favorite vendor");
          setLoadingItemId(null);
          return;
        }
      }

      setLoadingItemId(item.id);
      const response = await api.get(`/api/item/vendors/${item.id}`);
      const fetchedVendors: VendorType[] = response.data;

      if (!fetchedVendors || fetchedVendors.length === 0) {
        toast.error("No vendors available for this item");
        setLoadingItemId(null);
        return;
      }

      if (confirmedVendorId) {
        // If we have a confirmed vendor (items in cart), enforce using that vendor.
        const vendor = fetchedVendors.find(v => v._id === confirmedVendorId);

        if (vendor) {
          await executeAddToCart(item, confirmedVendorId);
          return;
        } else {
          const errorVendor = vendors.find(v => v._id === confirmedVendorId);
          const vendorName = errorVendor ? errorVendor.fullName : "your current vendor";
          toast.error(`Food item is not available in ${vendorName}`);
          setLoadingItemId(null);
          return;
        }
      }

      // Open vendor picker — clear loading so Confirm is not blocked
      setLoadingItemId(null);
      setSelectedItemForModal(item);
      setItemVendors(fetchedVendors);
      setModalSelectedVendor(null);
      setIsVendorModalOpen(true);

    } catch (error) {
      console.error("Error fetching vendors for item:", error);
      toast.error("Failed to load vendor options");
      setLoadingItemId(null);
    }
  };

  const handleConfirmVendor = async () => {
    if (!selectedItemForModal || !modalSelectedVendor) return;
    const vendorId = modalSelectedVendor._id;
    setConfirmedVendorId(vendorId);
    await executeAddToCart(selectedItemForModal, vendorId);
    setIsVendorModalOpen(false);
    setSelectedItemForModal(null);
    setModalSelectedVendor(null);
  };

  const handleCancelVendor = () => {
    setIsVendorModalOpen(false);
    setSelectedItemForModal(null);
    setModalSelectedVendor(null);
    setLoadingItemId(null); // Clear loading if modal is cancelled
  };

  // Helper to get cart item quantity
  const getCartItemQuantity = (itemId: string) => {
    if (confirmedVendorId) {
      const item = cartItems.find(
        (ci) => ci.itemId === itemId && ci.vendorId === confirmedVendorId
      );
      return item ? item.quantity : 0;
    }
    const relevantItems = cartItems.filter(ci => ci.itemId === itemId);
    if (relevantItems.length === 0) return 0;
    return relevantItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleIncrease = async (item: FoodItem) => {
    if (!userId) {
      toast.error("Please login first");
      return;
    }
    if (addingInFlightRef.current || loadingItemId) return;
    setLoadingItemId(item.id);
    try {
      if (confirmedVendorId) {
        const cartItem = cartItems.find(ci => ci.itemId === item.id && ci.vendorId === confirmedVendorId);
        if (cartItem) {
          await increaseItemQuantity({ ...item, vendorId: confirmedVendorId });
          return;
        }
      }
      const existingCartItems = cartItems.filter(ci => ci.itemId === item.id);
      if (existingCartItems.length === 1) {
        await increaseItemQuantity({ ...item, vendorId: existingCartItems[0].vendorId });
        return;
      }
      setLoadingItemId(null);
      await handleAddToCart(item);
      return;
    } catch (e) {
      console.error(e);
      toast.error("Failed to increase quantity");
    } finally {
      setLoadingItemId((current) => (current === item.id ? null : current));
    }
  };

  const handleDecrease = async (item: FoodItem) => {
    if (!userId) {
      toast.error("Please login first");
      return;
    }
    if (addingInFlightRef.current || loadingItemId) return;
    setLoadingItemId(item.id);
    try {
      if (confirmedVendorId) {
        await decreaseItemQuantity({ ...item, vendorId: confirmedVendorId });
        return;
      }
      const existingCartItems = cartItems.filter(ci => ci.itemId === item.id);
      if (existingCartItems.length > 0) {
        await decreaseItemQuantity({ ...item, vendorId: existingCartItems[0].vendorId });
      } else {
        toast.error("Item not found in cart");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to decrease quantity");
    } finally {
      setLoadingItemId(null);
    }
  };

  // Helper to get total quantity for retail items
  const getGlobalQuantity = (item: FoodItem) => {
    if (item.type !== 'retail') return 0;
    return vendors.reduce((acc, v) => {
      const inv = v.retailInventory?.find(i => i.itemId === item.id);
      return acc + (inv?.quantity || 0);
    }, 0);
  };

  // Helper to check availability across all vendors
  const checkGlobalAvailability = (item: FoodItem) => {
    if (vendors.length === 0) return false;

    if (item.type === 'retail') {
      // Check if ANY vendor has quantity > 0
      return vendors.some(v => v.retailInventory?.some(inv => inv.itemId === item.id && inv.quantity > 0));
    } else {
      // Check if ANY vendor has isAvailable == 'Y' (case insensitive)
      return vendors.some(v => v.produceInventory?.some(inv => inv.itemId === item.id && (inv.isAvailable === 'Y' || inv.isAvailable === 'y')));
    }
  };

  const renderItemList = () => {
    const key = `${selectedCategory}-${selectedKind}`;
    const categoryItems = items[key] || [];

    // Get unique subtypes available in this category
    const subtypes = Array.from(new Set(
      categoryItems
        .map(item => item.subtype)
        .filter((subtype): subtype is string => !!subtype && subtype.trim() !== '')
    )).sort();

    // Filter items based on dietary preference and subtype
    const filteredItems = categoryItems.filter(item => {
      // Dietary filter
      if (dietaryFilter === 'veg' && !item.isVeg) return false;
      if (dietaryFilter === 'non-veg' && item.isVeg) return false;

      // Subtype filter
      if (subtypeFilter !== 'all' && item.subtype !== subtypeFilter) return false;

      return true;
    });

    return (
      <div className={styles.sectionContainer}>
        <div className={styles.headerRow}>
          <button className={styles.backButton} onClick={() => {
            setSelectedKind(null);
            setSubtypeFilter('all'); // Reset subtype filter when going back
            setDietaryFilter('all');
          }}>
            <ArrowLeft size={20} /> Back
          </button>

          <h2 className={styles.sectionTitle}>{selectedKind}</h2>

          <div className={styles.headerTitleGroup}>
            <div className={styles.filterContainer}>
              <button
                className={`${styles.filterBtn} ${dietaryFilter === 'all' ? styles.active : ''}`}
                onClick={() => setDietaryFilter('all')}
              >
                All
              </button>
              <button
                className={`${styles.filterBtn} ${dietaryFilter === 'veg' ? styles.active : ''}`}
                onClick={() => setDietaryFilter('veg')}
              >
                Veg
              </button>
              <button
                className={`${styles.filterBtn} ${dietaryFilter === 'non-veg' ? styles.active : ''}`}
                onClick={() => setDietaryFilter('non-veg')}
              >
                Non-Veg
              </button>

              {subtypes.length > 0 && (
                <div className={styles.subtypeDropdownContainer} ref={subtypeDropdownRef}>
                  <div className={styles.filterDivider} />
                  <label className={styles.subtypeLabel}>Sub Types:</label>
                  <div className={styles.customDropdown}>
                    <div
                      className={`${styles.dropdownToggle} ${showSubtypeDropdown ? styles.active : ''}`}
                      onClick={() => setShowSubtypeDropdown(!showSubtypeDropdown)}
                    >
                      <span>{subtypeFilter === 'all' ? 'All Types' : subtypeFilter}</span>
                      <ChevronDown className={`${styles.dropdownIcon} ${showSubtypeDropdown ? styles.open : ''}`} size={16} />
                    </div>
                    <ul className={`${styles.dropdownList} ${showSubtypeDropdown ? styles.show : ''}`}>
                      <li
                        className={`${styles.dropdownItem} ${subtypeFilter === 'all' ? styles.selected : ''}`}
                        onClick={() => {
                          setSubtypeFilter('all');
                          setShowSubtypeDropdown(false);
                        }}
                      >
                        All Types
                      </li>
                      {subtypes.map(subtype => (
                        <li
                          key={subtype}
                          className={`${styles.dropdownItem} ${subtypeFilter === subtype ? styles.selected : ''}`}
                          onClick={() => {
                            setSubtypeFilter(subtype);
                            setShowSubtypeDropdown(false);
                          }}
                        >
                          {subtype}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.itemsGrid}>
          {filteredItems.map(item => {
            const isAvailable = checkGlobalAvailability(item);
            const totalQuantity = item.type === 'retail' ? getGlobalQuantity(item) : item.quantity;

            // Override item properties for display
            const displayItem = {
              ...item,
              isAvailable: isAvailable ? 'Y' : 'N',
              quantity: totalQuantity
            };

            return (
              <DishListItem
                key={item.id}
                item={displayItem}
                quantity={getCartItemQuantity(item.id)}
                isLoading={loadingItemId === item.id}
                onAdd={handleAddToCart}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
              />
            );
          })}
          {filteredItems.length === 0 && <p>No items found matching your selection.</p>}
        </div>
      </div>
    );
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
      <div className={styles.content}>
        <h1 className={styles.greeting}>
          {userId ? (
            <>
              Welcome Back! <span style={{ color: "#4ea199" }}>{userFullName?.split(" ")[0] || "User"}</span>
            </>
          ) : (
            <>
              Welcome to <span style={{ color: "#4ea199" }}>{collegeName}</span>
            </>
          )}
        </h1>

        {/* New Progressive Disclosure UI */}

        {/* 1. If no Kind Selected and no Category Selected -> Show Vendors & Category Toggles */}
        {!selectedCategory && !selectedKind && (
          <>
            {userId && (
              <FavoritesSection
                favoriteItems={userFavorites}
                convertFavoriteToFoodItem={convertFavoriteToFoodItem}
                userId={userId}
                categories={categories}
                onAdd={handleAddToCart}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                getCartItemQuantity={getCartItemQuantity}
                loadingItemId={loadingItemId}
                isLoading={isLoadingFavorites}
              />
            )}
            {renderVendorList()}
            {renderCategorySelection()}
          </>
        )}

        {/* 2. If Category Selected but No Kind Selected -> Show Kinds */}
        {selectedCategory && !selectedKind && renderKindSelection()}

        {/* 3. If Kind Selected -> Show Items */}
        {selectedKind && renderItemList()}

      </div>
      {/* Vendor Modal */}
      {selectedItemForModal && (
        <VendorModal
          show={isVendorModalOpen}
          availableVendors={itemVendors}
          selectedVendor={modalSelectedVendor}
          onVendorSelect={setModalSelectedVendor}
          onConfirm={handleConfirmVendor}
          onCancel={handleCancelVendor}
        />
      )}
    </div>
  );
};

// Wrapper Component (New CollegePageClient)
const CollegePageClient = ({ slug = "" }: { slug?: string }) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await api.get("/api/user/auth/user");
        if (response.status === 200) {
          setUserId(response.data._id);
        }
      } catch (err) {
        console.error("Error fetching user in wrapper:", err);
      }
    };
    fetchUser();
  }, []);

  return (
    <CartProvider userId={userId}>
      <CollegePageContent slug={slug} userIdProp={userId} />
    </CartProvider>
  );
};

export default CollegePageClient;
