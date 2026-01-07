import { useEffect, useState, useRef } from "react";
import axios from "axios";
import CartItemCard from "../components/CartItemCard";
import ExtrasCard from "../components/ExtrasCard";
// Import both BillBoxApproval (for vendors with pending order service) and BillBox (for others)
import BillBoxApproval from "../components/BillBoxApproval";
import BillBox from "../components/BillBox";
// NEW: Import OrderWaitingScreen component for showing wait time during vendor approval (new file)
import OrderWaitingScreen from "../components/OrderWaitingScreen";
import styles from "./styles/Cart.module.scss";
import { FoodItem, CartItem } from "../cart/types";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CART_COUNT_UPDATE_EVENT } from "../hooks/useCartCount";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "<UNDEFINED>";

interface ExtraItem {
  itemId: string;
  name: string;
  price: number;
  image: string;
  kind: string;
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

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return { headers: {}, withCredentials: true };
  }
  return {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  };
};

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
  const extrasListRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchExtras = async () => {
      if (!userData?._id) return;

      try {
        const response = await axios.get<ExtrasResponse>(
          `${BACKEND_URL}/cart/extras/${userData._id}`,
          getAuthHeaders()
        );

        if (response.data.extras) {
          const formatted: FoodItem[] = response.data.extras.map(
            (e: ExtraItem) => ({
              _id: e.itemId,
              name: e.name,
              image: e.image,
              price: e.price,
              kind: e.kind,
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
      const token = localStorage.getItem("token");

      if (!token) {
        setUserLoggedIn(false);
        const rawGuest = localStorage.getItem("guest_cart") || "[]";
        try {
          const guestCart = JSON.parse(rawGuest) as GuestCartItem[];
          const guestCartWithCategory: CartItem[] = guestCart.map((item) => ({
            ...item,
            category: item.kind === "Retail" ? "Retail" as const : "Produce" as const
          }));
          setCart(guestCartWithCategory);
        // Dispatch event to update cart count in navbar
        window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));
        } catch {
          setCart([]);
        }
        return;
      }

      try {
        const authUrl = `${BACKEND_URL}/api/user/auth/user`;
        const res = await fetch(authUrl, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          setUserLoggedIn(false);
          const rawGuest2 = localStorage.getItem("guest_cart") || "[]";
          try {
            setCart(JSON.parse(rawGuest2));
          } catch {
            setCart([]);
          }
          return;
        }

        const userData = await res.json();
        setUserLoggedIn(true);
        setUserData(userData);

        /** ─── GET /cart ─── **/
        const cartRes = await axios.get<CartResponse>(
          `${BACKEND_URL}/cart/${userData._id}`,
          getAuthHeaders()
        );

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
            packable: c.packable
          };
          return cartItem;
        });

        setCart(detailedCart);
        // Dispatch event to update cart count in navbar
        window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));

        // Check if vendor has pending order service
        if (cartRes.data.vendorId) {
          try {
            const vendorServicesRes = await axios.get(
              `${BACKEND_URL}/api/vendor/${cartRes.data.vendorId}/assignments`,
              getAuthHeaders()
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
            // Default to false if we can't fetch services
            setHasPendingOrderService(false);
          }
        }

        // Fetch extras after cart is loaded
        await fetchExtras();
      } catch {
        localStorage.removeItem("token");
        setUserLoggedIn(false);
      }
    };

    fetchUserAndCart();
  }, []);

  // Add a new useEffect to refetch extras when cart changes
  useEffect(() => {
    if (userData?._id && cart.length > 0) {
      const fetchExtras = async () => {
        try {
          const response = await axios.get<ExtrasResponse>(
            `${BACKEND_URL}/cart/extras/${userData._id}`,
            getAuthHeaders()
          );

          if (response.data.extras) {
            const formatted: FoodItem[] = response.data.extras.map(
              (e: ExtraItem) => ({
                _id: e.itemId,
                name: e.name,
                image: e.image,
                price: e.price,
                kind: e.kind,
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
        const vendorServicesRes = await axios.get(
          `${BACKEND_URL}/api/vendor/${vendorId}/assignments`,
          getAuthHeaders()
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
      const cartRes = await axios.get<CartResponse>(
        `${BACKEND_URL}/cart/${userData._id}`,
        getAuthHeaders()
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
          packable: c.packable
        };
      });
      setCart(updated);
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));
    } catch {
      // Error refetching cart
    }
  };

  // Cancel all pending orders when cart changes (only if vendor has approval service)
  const cancelPendingOrders = async () => {
    if (!userLoggedIn || !userData || !hasPendingOrderService) return;
    
    try {
      // Silently cancel pending orders - don't show toast if none exist
      await axios.post(
        `${BACKEND_URL}/order-approval/cancel-all/${userData._id}`,
        {},
        getAuthHeaders()
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

    if (userLoggedIn && userData) {
      // Cancel any pending orders when cart changes
      cancelPendingOrders();
      
      axios
        .post(
          `${BACKEND_URL}/cart/add-one/${userData._id}`,
          { itemId: id, kind: thisItem.kind },
          getAuthHeaders()
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
              `Only ${errorMsg.split("Only ")[1]} available for ${
                thisItem.name
              }`
            );
          } else {
            toast.error("Failed to increase quantity");
          }
        });
    } else {
      const updatedCart = cart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity + 1 } : item
      ) as CartItem[];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.success(`Increased quantity of ${thisItem.name}`);
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));
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

    if (userLoggedIn && userData) {
      // Cancel any pending orders when cart changes
      cancelPendingOrders();
      
      axios
        .post(
          `${BACKEND_URL}/cart/remove-one/${userData._id}`,
          { itemId: id, kind: thisItem.kind },
          getAuthHeaders()
        )
        .then(() => {
          toast.info(`Decreased quantity of ${thisItem.name}`);
          reFetchCart();
        })
        .catch((err) => {
          toast.error(
            err.response?.data?.message || "Failed to decrease quantity"
          );
        });
    } else {
      const updatedCart = cart.map((item) =>
        item._id === id ? { ...item, quantity: item.quantity - 1 } : item
      ) as CartItem[];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.info(`Decreased quantity of ${thisItem.name}`);
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));
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
      
      axios
        .post(
          `${BACKEND_URL}/cart/remove-item/${userData._id}`,
          { itemId: id, kind: thisItem.kind },
          getAuthHeaders()
        )
        .then(() => {
          toast.error(`${thisItem.name} removed from cart`);
          reFetchCart();
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "Failed to remove item");
        });
    } else {
      const updatedCart = cart.filter((item) => item._id !== id) as CartItem[];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.error(`${thisItem.name} removed from cart`);
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));
    }
  };

  const addToCart = (item: FoodItem) => {
    if (userLoggedIn && userData) {
      // Get vendorId from the first item in cart
      const vendorId = cart[0]?.vendorId;
      if (!vendorId) {
        toast.error("Cannot add items without a vendor selected");
        return;
      }

      // Cancel any pending orders when cart changes
      cancelPendingOrders();

      axios
        .post(
          `${BACKEND_URL}/cart/add/${userData._id}`,
          {
            itemId: item._id,
            kind: item.kind,
            quantity: 1,
            vendorId: vendorId,
          },
          getAuthHeaders()
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
              category: item.kind === "Retail" ? "Retail" as const : "Produce" as const
            },
          ];
      setCart(updatedCart);
      localStorage.setItem("guest_cart", JSON.stringify(updatedCart));
      toast.success(`${item.name} added to cart!`);
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event(CART_COUNT_UPDATE_EVENT));
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
      const scrollAmount = 184; // 160px card + 24px gap
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = extrasListRef.current;
    if (container) {
      const scrollAmount = 184; // 160px card + 24px gap
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
        <div className={styles.cartLeft}>
          <section className={styles.cartSection}>
            {cart.length === 0 ? (
              <div className={styles.emptyCartMessage}>
                <h2>Oops! Your cart is empty</h2>
                <p>
                  Looks like you haven&apos;t added any items to your cart yet.
                </p>
                <button
                  className={styles.homeButton}
                  onClick={() => router.push("/home")}
                >
                  Go to Home
                </button>
              </div>
            ) : (
              <>
                <div className={styles.vendorInfo}>
                  <h3>Vendor: {getVendorName(cart[0]?.vendorName)}</h3>
                </div>
                <div className={styles.cartItems}>
                  {cart.map((item, index) => (
                    <CartItemCard
                      key={item._id ?? index}
                      item={item}
                      onIncrease={() => increaseQty(item._id)}
                      onDecrease={() => decreaseQty(item._id)}
                      onRemove={() => removeItem(item._id)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {cart.length > 0 && (
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
                  className={`${styles.extrasList} ${
                    filteredExtras.length === 1 ? styles.singleCard : ""
                  }`}
                >
                  {filteredExtras.length > 0 ? (
                    filteredExtras.map((item) => {
                      const cartItem = cart.find(
                        (cartItem) => cartItem._id === item._id
                      );
                      const quantity = cartItem?.quantity || 0;

                      return (
                        <ExtrasCard
                          key={item._id}
                          item={item}
                          onAdd={addToCart}
                          onIncrease={increaseQty}
                          onDecrease={decreaseQty}
                          quantity={quantity}
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
          )}
        </div>

        <div className={styles.cartPage}>
          {/* … left‐side items & extras … */}

          {cart.length > 0 && userData && (
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
                    window.location.href = `/payment?orderId=${orderId}`;
                  }}
                />
              )}
            </aside>
          )}
        </div>
      </div>
      
      {/* Order waiting screen overlay - only show if using approval workflow */}
      {hasPendingOrderService && showWaitingScreen && currentOrderId && userData && (
        <OrderWaitingScreen
          orderId={currentOrderId}
          userId={userData._id}
          onOrderAccepted={() => {
            // Order accepted - clear cart and redirect to active orders
            setCart([]);
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
