import { useEffect, useState, useRef } from "react";
import api from "@/utils/apiUtils";
import DishListItemV2 from "../components/food/DishListItem/DishListItemV2";
// Import both BillBoxApproval (for vendors with pending order service) and BillBox (for others)
import BillBoxApproval from "../components/cart/BillBoxApproval/BillBoxApproval";
import BillBox from "../components/cart/BillBox/BillBox";
// NEW: Import OrderWaitingScreen component for showing wait time during vendor approval (new file)
import OrderWaitingScreen from "../components/order/OrderWaitingScreen/OrderWaitingScreen";
import styles from "./styles/Cart.module.scss";
import { FoodItem, CartItem } from "../cart/types";
import { FoodItem as SharedFoodItem } from "@/app/food/[slug]/types";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { notifyCartCountChanged, sumCartQuantities } from "../hooks/useCartCount";
import { Skeleton, SkeletonCircle, SkeletonText } from "../components/shared/Skeleton/Skeleton";


interface ExtraItem {
  itemId: string;
  name: string;
  price: number;
  image: string;
  kind: string;
  isVeg?: boolean | string;
}

interface CartResponse {
  cart: Array<{
    itemId: string;
    name: string;
    image: string;
    unit: string;
    price: number;
    quantity: number;
    kind: string;
    packable?: boolean;
    isVeg?: boolean | string;
    totalPrice: number;
  }>;
  vendorName: string;
  vendorId: string;
}

interface ExtrasResponse {
  message: string;
  extras: ExtraItem[];
}

interface GuestCartItem extends Omit<CartItem, 'category'> {
  kind: string;
}


const getVendorName = (vendorName: string | undefined) => {
  if (!vendorName) {
    return "Unknown Vendor";
  }
  return vendorName;
};

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [extras, setExtras] = useState<FoodItem[]>([]);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<{
    _id: string;
    foodcourtId: string;
  } | null>(null);
  // NEW: State for order approval workflow
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  // NEW: State to check if vendor has pending order service
  const [hasPendingOrderService, setHasPendingOrderService] = useState<boolean>(false);
  // State for scroll arrows
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const extrasListRef = useRef<HTMLDivElement>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchExtras = async () => {
      if (!userData?._id) return;

      try {
        const response = await api.get<ExtrasResponse>(
          `/cart/extras/${userData._id}`
        );

        if (response.data.extras) {
          const formatted: FoodItem[] = response.data.extras.map(
            (e: ExtraItem) => ({
              _id: e.itemId,
              name: e.name,
              image: e.image,
              price: e.price,
              kind: e.kind,
              isVeg: e.isVeg,
            })
          );
          setExtras(formatted);
        } else {
          setExtras([]);
        }
      } catch {
        setExtras([]);
      }
    };

    const fetchUserAndCart = async () => {
      setIsLoading(true);
      // Tokens are now in HTTP-only cookies.
      // We try to fetch the user to see if we are logged in.

      try {
        const res = await api.get("/api/user/auth/user");
        const userData = res.data;
        setUserLoggedIn(true);
        setUserData(userData);

        /** ─── GET /cart ─── **/
        const cartRes = await api.get<CartResponse>(`/cart/${userData._id}`);

        const rawCart = cartRes.data.cart || [];
        const detailedCart: CartItem[] = rawCart.map((c) => {
          const category = c.kind === "Retail" ? "Retail" : "Produce";
          const cartItem: CartItem = {
            _id: c.itemId,
            userId: userData._id,
            foodcourtId: userData.foodcourtId,
            itemId: {
              _id: c.itemId,
              name: c.name,
              price: c.price,
              image: c.image,
              kind: c.kind
            },
            quantity: c.quantity,
            kind: c.kind,
            name: c.name,
            price: c.price,
            image: c.image,
            vendorName: cartRes.data.vendorName,
            vendorId: cartRes.data.vendorId,
            category,
            packable: c.packable,
            isVeg: c.isVeg
          };
          return cartItem;
        });

        setCart(detailedCart);
        notifyCartCountChanged({
          count: sumCartQuantities(detailedCart),
          userId: userData?._id ?? null,
        });

        if (cartRes.data.vendorId) {
          try {
            const vendorServicesRes = await api.get(
              `/api/vendor/${cartRes.data.vendorId}/assignments`
            );
            if (vendorServicesRes.data.success && vendorServicesRes.data.data.services) {
              const services = vendorServicesRes.data.data.services || [];
              const hasPendingOrder = services.some(
                (service: { name?: string }) =>
                  service.name?.toLowerCase().includes("pending order")
              );
              setHasPendingOrderService(hasPendingOrder);
            }
          } catch (error) {
            console.error("Error fetching vendor services:", error);
            setHasPendingOrderService(false);
          }
        }

        await fetchExtras();
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        // If 401, we are not logged in, handle as guest
        if (error.response?.status === 401) {
          setUserLoggedIn(false);
          const rawGuest = localStorage.getItem("guest_cart") || "[]";
          try {
            const guestCart = JSON.parse(rawGuest) as GuestCartItem[];
            const guestCartWithCategory: CartItem[] = guestCart.map((item) => ({
              ...item,
              category: item.kind === "Retail" ? "Retail" as const : "Produce" as const
            }));
            setCart(guestCartWithCategory);
            notifyCartCountChanged({
              count: sumCartQuantities(guestCartWithCategory),
              userId: null,
            });
          } catch {
            setCart([]);
            notifyCartCountChanged({ count: 0, userId: null });
          }
        } else {
          console.error("Error fetching user or cart:", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a new useEffect to refetch extras when cart changes
  useEffect(() => {
    if (userData?._id && cart.length > 0) {
      const fetchExtras = async () => {
        try {
          const response = await api.get<ExtrasResponse>(
            `/cart/extras/${userData._id}`
          );

          if (response.data.extras) {
            const formatted: FoodItem[] = response.data.extras.map(
              (e: ExtraItem) => ({
                _id: e.itemId,
                name: e.name,
                image: e.image,
                price: e.price,
                kind: e.kind,
                isVeg: e.isVeg,
              })
            );
            setExtras(formatted);
          } else {
            setExtras([]);
          }
        } catch {
          setExtras([]);
        }
      };

      fetchExtras();
    } else {
      setExtras([]);
    }

  }, [cart, userData?._id]);

  // Check vendor services when cart vendorId changes
  useEffect(() => {
    const checkVendorServices = async () => {
      if (!userLoggedIn || !userData || cart.length === 0) {
        setHasPendingOrderService(false);
        return;
      }

      const vendorId = cart[0]?.vendorId;
      if (!vendorId) {
        setHasPendingOrderService(false);
        return;
      }

      try {
        const vendorServicesRes = await api.get(
          `/api/vendor/${vendorId}/assignments`
        );
        if (vendorServicesRes.data.success && vendorServicesRes.data.data.services) {
          const services = vendorServicesRes.data.data.services || [];
          const hasPendingOrder = services.some(
            (service: { name?: string }) =>
              service.name?.toLowerCase().includes("pending order")
          );
          setHasPendingOrderService(hasPendingOrder);
        } else {
          setHasPendingOrderService(false);
        }
      } catch (error) {
        console.error("Error fetching vendor services:", error);
        // Default to false if we can't fetch services
        setHasPendingOrderService(false);
      }
    };

    checkVendorServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, userLoggedIn, userData?._id]);

  const reFetchCart = async () => {
    try {
      if (!userData) return;
      const cartRes = await api.get<CartResponse>(
        `/cart/${userData._id}`
      );
      const raw = cartRes.data.cart || [];
      const updated: CartItem[] = raw.map((c) => {
        const category = c.kind === "Retail" ? "Retail" : "Produce";
        return {
          _id: c.itemId,
          userId: userData._id,
          foodcourtId: userData.foodcourtId,
          itemId: {
            _id: c.itemId,
            name: c.name,
            price: c.price,
            image: c.image,
            kind: c.kind
          },
          quantity: c.quantity,
          kind: c.kind,
          name: c.name,
          price: c.price,
          image: c.image,
          vendorName: cartRes.data.vendorName,
          vendorId: cartRes.data.vendorId,
          category,
          packable: c.packable,
          isVeg: c.isVeg
        };
      });
      setCart(updated);
      notifyCartCountChanged({
        count: sumCartQuantities(updated),
        userId: userData._id,
      });
    } catch {
      // Error refetching cart
    }
  };

  // Cancel all pending orders when cart changes (only if vendor has approval service)
  const cancelPendingOrders = async () => {
    if (!userLoggedIn || !userData || !hasPendingOrderService) return;

    try {
      // Silently cancel pending orders - don't show toast if none exist
      await api.post(
        `/order-approval/cancel-all/${userData._id}`,
        {}
      );
      // Also hide waiting screen if it's showing
      setShowWaitingScreen(false);
      setCurrentOrderId(null);
    } catch (error) {
      // Silently fail - this is not critical for cart operations
      console.error("Error cancelling pending orders:", error);
    }
  };

  const increaseQty = (id: string) => {
    const thisItem = cart.find((i) => i._id === id);
    if (!thisItem) {
      return;
    }

    if (loadingItemId) return;
    setLoadingItemId(id);
    if (userLoggedIn && userData) {
      // Cancel any pending orders when cart changes
      cancelPendingOrders();

      api
        .post(
          `/cart/add-one/${userData._id}`,
          { itemId: id, kind: thisItem.kind }
        )
        .then(() => {
          toast.success(`Increased quantity of ${thisItem.name}`);
          reFetchCart();
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.message || "";
          if (errorMsg.includes("max quantity")) {
            toast.warning(`Maximum limit reached for ${thisItem.name}`);
          } else if (errorMsg.includes("Only")) {
            toast.warning(
              `Only ${errorMsg.split("Only ")[1]} available for ${thisItem.name
              }`
            );
          } else {
            toast.error("Failed to increase quantity");
          }
        })
        .finally(() => {
          setLoadingItemId(null);
        });
    } else {
      const updatedCart = cart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item
      ) as CartItem[];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.success(`Increased quantity of ${thisItem.name}`);
      setLoadingItemId(null);
      notifyCartCountChanged({
        count: sumCartQuantities(updatedCart),
        userId: null,
      });
    }
  };

  const decreaseQty = (id: string) => {
    const thisItem = cart.find((i) => i._id === id);
    if (!thisItem) {
      return;
    }

    if (thisItem.quantity <= 0) {
      return;
    }

    if (loadingItemId) return;
    setLoadingItemId(id);
    if (userLoggedIn && userData) {
      // Cancel any pending orders when cart changes
      cancelPendingOrders();

      api
        .post(
          `/cart/remove-one/${userData._id}`,
          { itemId: id, kind: thisItem.kind }
        )
        .then(() => {
          toast.info(`Decreased quantity of ${thisItem.name}`);
          reFetchCart();
        })
        .catch((err) => {
          toast.error(
            err.response?.data?.message || "Failed to decrease quantity"
          );
        })
        .finally(() => {
          setLoadingItemId(null);
        });
    } else {
      const updatedCart = cart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity - 1 } : item
      ) as CartItem[];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.info(`Decreased quantity of ${thisItem.name}`);
      setLoadingItemId(null);
      notifyCartCountChanged({
        count: sumCartQuantities(updatedCart),
        userId: null,
      });
    }
  };

  const removeItem = (id: string) => {
    const thisItem = cart.find((i) => i._id === id);
    if (!thisItem) {
      return;
    }

    if (userLoggedIn && userData) {
      // Cancel any pending orders when cart changes
      cancelPendingOrders();

      api
        .post(
          `/cart/remove-item/${userData._id}`,
          { itemId: id, kind: thisItem.kind }
        )
        .then(() => {
          toast.error(`${thisItem.name} removed from cart`);
          reFetchCart();
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Failed to remove item");
        })
        .finally(() => {
          setLoadingItemId(null);
        });
    } else {
      const updatedCart = cart.filter((item) => item._id !== id) as CartItem[];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.error(`${thisItem.name} removed from cart`);
      setLoadingItemId(null);
      notifyCartCountChanged({
        count: sumCartQuantities(updatedCart),
        userId: null,
      });
    }
  };

  const addToCart = (item: FoodItem) => {
    if (loadingItemId) return;
    setLoadingItemId(item._id);
    if (userLoggedIn && userData) {
      // Get vendorId from the first item in cart
      const vendorId = cart[0]?.vendorId;
      if (!vendorId) {
        toast.error("Cannot add items without a vendor selected");
        setLoadingItemId(null);
        return;
      }

      // Cancel any pending orders when cart changes
      cancelPendingOrders();

      api
        .post(
          `/cart/add/${userData._id}`,
          {
            itemId: item._id,
            kind: item.kind,
            quantity: 1,
            vendorId: vendorId,
          }
        )
        .then(() => {
          toast.success(`${item.name} added to cart!`);
          reFetchCart();
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.message || "";
          if (errorMsg.includes("max quantity")) {
            toast.warning(`Maximum limit reached for ${item.name}`);
          } else if (errorMsg.includes("Only")) {
            toast.warning(
              `Only ${errorMsg.split("Only ")[1]} available for ${item.name}`
            );
          } else {
            toast.error("Failed to add item to cart");
          }
        })
        .finally(() => {
          setLoadingItemId(null);
        });
    } else {
      const existingItem = cart.find((i) => i._id === item._id);
      const updatedCart = existingItem
        ? cart.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        )
        : [
          ...cart,
          {
            _id: item._id,
            userId: "guest",
            foodcourtId: "guest",
            itemId: {
              _id: item._id,
              name: item.name,
              price: item.price,
              image: item.image,
              kind: item.kind || "Retail",
            },
            quantity: 1,
            kind: item.kind || "Retail",
            name: item.name,
            price: item.price,
            image: item.image,
            vendorName: "guest",
            vendorId: "guest",
            category: item.kind === "Retail" ? "Retail" as const : "Produce" as const,
            isVeg: item.isVeg
          },
        ];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.success(`${item.name} added to cart!`);
      setLoadingItemId(null);
      notifyCartCountChanged({
        count: sumCartQuantities(updatedCart),
        userId: null,
      });
    }
  };

  // Filter out items that are already in cart
  const filteredExtras = extras.filter(
    (extra) => !cart.some((cartItem) => cartItem._id === extra._id)
  );

  // Function to check scroll position and update arrow visibility
  const checkScrollPosition = () => {
    const container = extrasListRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px threshold for rounding
  };

  // Scroll functions - scroll by approximately one card width (160px) + gap (24px)
  const scrollLeft = () => {
    const container = extrasListRef.current;
    if (container) {
      const scrollAmount = 204; // 180px card + 24px gap
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = extrasListRef.current;
    if (container) {
      const scrollAmount = 204; // 180px card + 24px gap
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Check scroll position on mount, when extras change, and on scroll
  useEffect(() => {
    // Use setTimeout to ensure DOM is fully rendered
    const timeoutId = setTimeout(() => {
      checkScrollPosition();
    }, 100);

    const container = extrasListRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      // Also check on resize
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [filteredExtras]);

  return (
    <>
      {/* 1. Load Razorpay after the page is interactive */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className={styles.cartPage}>
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
        {isLoading ? (
          <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
            <div className="flex-1 space-y-4">
              <Skeleton width={200} height={40} className="mb-8 rounded-lg opacity-60 bg-teal-900/10" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md shadow-sm flex gap-6 items-center">
                  <Skeleton width={100} height={100} className="rounded-xl shrink-0 bg-teal-900/5" />
                  <div className="flex-1">
                    <Skeleton width="60%" height={24} className="mb-3 bg-teal-900/10" />
                    <SkeletonText lines={2} className="opacity-40 bg-teal-900/5" />
                  </div>
                  <div className="flex items-center gap-3">
                    <SkeletonCircle size={32} className="bg-teal-900/5" />
                    <Skeleton width={40} height={32} className="bg-teal-900/10" />
                    <SkeletonCircle size={32} className="bg-teal-900/5" />
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full lg:w-96">
              <div className="p-8 rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl shadow-lg sticky top-32">
                <Skeleton width={150} height={28} className="mb-8 bg-teal-900/10" />
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between">
                    <Skeleton width={100} height={20} className="bg-teal-900/5" />
                    <Skeleton width={60} height={20} className="bg-teal-900/10" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton width={120} height={20} className="bg-teal-900/5" />
                    <Skeleton width={60} height={20} className="bg-teal-900/10" />
                  </div>
                </div>
                <Skeleton width="100%" height={56} className="rounded-2xl bg-teal-600/20" />
              </div>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className={styles.emptyCartMessage}>
            <h2>Oops! Your cart is empty</h2>
            <p>
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <button
              className={styles.homeButton}
              onClick={() => router.push("/food")}
            >
              Add Items To Cart
            </button>
          </div>
        ) : (
          <>
            <div className={styles.cartLeft}>
              <section className={styles.cartSection}>
                <div className={styles.vendorInfo}>
                  <h3>Vendor: {getVendorName(cart[0]?.vendorName)}</h3>
                </div>
                <div className={styles.cartItems}>
                  {cart.map((item, index) => {
                    const dishItem = {
                      _id: item._id,
                      title: item.name,
                      price: item.price,
                      image: item.image,
                      type: item.kind?.toLowerCase() === 'retail' ? 'retail' : 'produce',
                      isAvailable: 'Y',
                      isVeg: (item as CartItem & { isVeg?: boolean | string }).isVeg,
                    };
                    return (
                      <DishListItemV2
                        key={item._id ?? index}
                        item={dishItem as unknown as SharedFoodItem}
                        quantity={item.quantity}
                        isLoading={loadingItemId === item._id}
                        onIncrease={() => increaseQty(item._id)}
                        onDecrease={() => decreaseQty(item._id)}
                        onAdd={() => increaseQty(item._id)}
                        onRemove={() => removeItem(item._id)}
                        variant="cart"
                      />
                    );
                  })}
                </div>
              </section>

              <section className={styles.extrasSection}>
                <h3>More from {getVendorName(cart[0]?.vendorName)}</h3>
                <div className={styles.extrasContainer}>
                  {filteredExtras.length > 1 && canScrollLeft && (
                    <button
                      className={styles.scrollArrow}
                      onClick={scrollLeft}
                      aria-label="Scroll left"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  <div
                    ref={extrasListRef}
                    className={`${styles.extrasList} ${filteredExtras.length === 1 ? styles.singleCard : ""
                      }`}
                  >
                    {filteredExtras.length > 0 ? (
                      filteredExtras.map((item) => {
                        const cartItem = cart.find(
                          (cartItem) => cartItem._id === item._id
                        );
                        const quantity = cartItem?.quantity || 0;
                        const dishItem = {
                          _id: item._id,
                          title: item.name,
                          price: item.price,
                          image: item.image,
                          type: item.kind?.toLowerCase() === 'retail' ? 'retail' : 'produce',
                          isAvailable: 'Y',
                          isVeg: (item as unknown as { isVeg?: boolean | string }).isVeg,
                        };

                        return (
                          <DishListItemV2
                            key={item._id}
                            item={dishItem as unknown as SharedFoodItem}
                            onAdd={() => addToCart(item)}
                            onIncrease={() => increaseQty(item._id)}
                            onDecrease={() => decreaseQty(item._id)}
                            quantity={quantity}
                            isLoading={loadingItemId === item._id}
                            variant="boxed"
                          />
                        );
                      })
                    ) : (
                      <p className={styles.emptyExtras}>No extras available.</p>
                    )}
                  </div>
                  {filteredExtras.length > 1 && canScrollRight && (
                    <button
                      className={styles.scrollArrow}
                      onClick={scrollRight}
                      aria-label="Scroll right"
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}
                </div>
              </section>
            </div>

            {userData && (
              <aside className={styles.cartRight}>
                {/* Conditionally render BillBoxApproval (if vendor has pending order service) or BillBox (regular flow) */}
                {hasPendingOrderService ? (
                  <BillBoxApproval
                    userId={userData._id}
                    items={cart}
                    onOrderSubmitted={(orderId) => {
                      // Order submitted - will show waiting screen
                      setCurrentOrderId(orderId);
                      setShowWaitingScreen(true);
                    }}
                  />
                ) : (
                  <BillBox
                    userId={userData._id}
                    items={cart}
                    onOrder={(orderId) => {
                      // Clear cart and redirect to payment confirmation page
                      setCart([]);
                      notifyCartCountChanged({ count: 0, userId: userData?._id ?? null });
                      window.location.href = `/payment?orderId=${orderId}`;
                    }}
                  />
                )}
              </aside>
            )}
          </>
        )}
      </div>

      {/* Order waiting screen overlay - only show if using approval workflow */}
      {hasPendingOrderService && showWaitingScreen && currentOrderId && userData && (
        <OrderWaitingScreen
          orderId={currentOrderId}
          userId={userData._id}
          onOrderAccepted={() => {
            // Order accepted - clear cart and redirect to active orders
            setCart([]);
            notifyCartCountChanged({ count: 0, userId: userData?._id ?? null });
            setShowWaitingScreen(false);
            setCurrentOrderId(null);
            toast.success("Order accepted by vendor! Redirecting to your orders...");
            setTimeout(() => {
              router.push("/activeorders");
            }, 1500);
          }}
          onOrderDenied={(reason) => {
            // Order denied - show message and hide waiting screen, refresh cart
            setShowWaitingScreen(false);
            setCurrentOrderId(null);
            toast.error(`Order denied: ${reason || "Item not available"}`);
            // Refresh cart to get updated state
            reFetchCart();
          }}
          onOrderCancelled={() => {
            // Order cancelled - hide waiting screen and refresh cart so user can modify
            setShowWaitingScreen(false);
            setCurrentOrderId(null);
            toast.info("Order cancelled. You can now modify your cart.");
            // Refresh cart to get updated state
            reFetchCart();
          }}
        />
      )}
    </>
  );
}
