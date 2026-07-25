import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Loader2, Sparkles, Circle } from 'lucide-react';
import { toast } from 'react-toastify';
import styles from '../styles/CollegePage.module.scss';
import { FoodItem, Vendor } from '../types';
import { useCart } from '../context/CartContext';
import VendorModal from './VendorModal';
import ItemDetailModal from './ItemDetailModal';
import { checkItemAvailability } from '../utils/cartUtils';

interface ProductCardProps {
  item: FoodItem;
  categories?: { retail: string[]; produce: string[] };
  userId?: string | null;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

const ProductCard = ({ item, categories, userId, onModalOpen, onModalClose }: ProductCardProps) => {
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [availableVendors, setAvailableVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const { cartItems, addItemToCart, increaseItemQuantity, decreaseItemQuantity } = useCart();

  // Find the cart item for this product
  // If item has a specific vendorId (e.g. from favorites), match both itemId and vendorId
  // Otherwise, fallback to the item already in cart from any vendor (single-vendor policy)
  const cartItem = cartItems.find((ci) =>
    ci.itemId === item.id && (item.vendorId ? ci.vendorId === item.vendorId : true)
  );
  const quantity = cartItem?.quantity || 0;

  // Debug log for cart state
  useEffect(() => {
    console.log('Cart state updated:', {
      itemId: item.id,
      cartItems,
      foundItem: cartItem,
      quantity
    });
  }, [cartItems, item.id, cartItem, quantity]);

  // Check if description is truncated
  useEffect(() => {
    if (item.description && descriptionRef.current) {
      const element = descriptionRef.current;
      // Create a temporary element to measure full text height
      const tempElement = document.createElement('div');
      tempElement.style.cssText = window.getComputedStyle(element).cssText;
      tempElement.style.webkitLineClamp = 'unset';
      tempElement.style.display = 'block';
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.width = element.offsetWidth + 'px';
      tempElement.textContent = item.description;
      document.body.appendChild(tempElement);

      const fullHeight = tempElement.offsetHeight;
      const currentHeight = element.offsetHeight;

      document.body.removeChild(tempElement);

      // Check if text is truncated (full height > current height with some tolerance)
      setIsDescriptionTruncated(fullHeight > currentHeight + 5);
    } else {
      setIsDescriptionTruncated(false);
    }
  }, [item.description]);

  const handleReadMore = () => {
    setShowItemDetailModal(true);
    if (onModalOpen) {
      onModalOpen();
    }
  };

  const handleCloseItemDetailModal = () => {
    setShowItemDetailModal(false);
    if (onModalClose) {
      onModalClose();
    }
  };

  const handleAddToCart = async () => {
    if (!userId) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      setLoading(true);

      // If item already has a specific vendorId (from favorites)
      if (item.vendorId) {
        // Enforce single-vendor cart policy
        if (cartItems.length > 0 && cartItems[0].vendorId !== item.vendorId) {
          toast.error(`Food item is only available in ${cartItems[0].vendorName} for your current cart`);
          return;
        }

        // Check if item is available in this specific vendor
        const { isAvailable, vendors } = await checkItemAvailability(item, item.vendorId, categories);
        if (!isAvailable || !vendors || vendors.length === 0) {
          toast.error('This item is currently unavailable from your favorite vendor');
          return;
        }

        const vendor = vendors[0];
        await addItemToCart(item, vendor);
        return;
      }

      const { vendors } = await checkItemAvailability(item, null, categories);
      let filteredVendors = vendors || [];
      // If the item is a special, only show vendors with isSpecial === 'Y'
      if (item.isSpecial === 'Y') {
        filteredVendors = filteredVendors.filter(vendor => vendor.inventoryValue?.isSpecial === 'Y');
      }
      if (!filteredVendors || filteredVendors.length === 0) {
        toast.error('No vendors have this item available');
        return;
      }
      setAvailableVendors(filteredVendors);
      setSelectedVendor(null);
      setShowVendorModal(true);
    } catch (error) {
      console.error('Error checking item availability:', error);
      toast.error('Failed to check item availability');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleVendorConfirm = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    try {
      setLoading(true);
      // Create a new item object with the selected vendor ID
      const itemWithVendor = {
        ...item,
        vendorId: selectedVendor._id
      };
      console.log('Adding item with vendor:', itemWithVendor);
      await addItemToCart(itemWithVendor, selectedVendor);
      setShowVendorModal(false);
      setSelectedVendor(null);
      setAvailableVendors([]);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowVendorModal(false);
    setSelectedVendor(null);
    setAvailableVendors([]);
  };

  const handleIncreaseQuantity = async () => {
    if (!userId) {
      toast.error('Please login to modify cart');
      return;
    }

    if (!cartItem) {
      // If no item in cart, show vendor modal first
      handleAddToCart();
      return;
    }

    try {
      setLoading(true);
      // Create a new item object with the existing vendor ID
      const itemWithVendor = {
        ...item,
        vendorId: cartItem.vendorId
      };
      console.log('Increasing quantity for item:', itemWithVendor);
      await increaseItemQuantity(itemWithVendor);
    } catch (error) {
      console.error('Error increasing quantity:', error);
      if (error instanceof Error) {
        if (error.message.includes("max quantity")) {
          toast.warning(`Maximum limit reached for ${item.title}`);
        } else if (error.message.includes("Only")) {
          toast.warning(`Only ${error.message.split("Only ")[1]} available for ${item.title}`);
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Failed to increase quantity');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!userId) {
      toast.error('Please login to modify cart');
      return;
    }

    if (!cartItem) return;

    try {
      setLoading(true);
      // Create a new item object with the existing vendor ID
      const itemWithVendor = {
        ...item,
        vendorId: cartItem.vendorId
      };
      console.log('Decreasing quantity for item:', itemWithVendor);
      await decreaseItemQuantity(itemWithVendor);
    } catch (error) {
      console.error('Error decreasing quantity:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to decrease quantity');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.slideWrapper}>
        <div
          className={styles.foodCard}
          data-theme-component={item.isSpecial === 'Y' ? 'card.offer' : 'card.dish'}
        >
          <div className={styles.imageContainer}>
            {item.image ? (
              <img src={item.image} alt={item.title} className={styles.foodImage} />
            ) : null}
            {item.isSpecial === 'Y' && (
              <div className={styles.specialBadge}>
                <Sparkles size={14} />
                <span>Special</span>
              </div>
            )}
            {item.isVeg !== undefined && (
              <div className={styles.vegIndicator}>
                <div className={item.isVeg ? styles.veg : styles.nonVeg}>
                  <Circle
                    size={12}
                    fill="currentColor"
                    className={styles.vegIcon}
                  />
                  <span>{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                </div>
              </div>
            )}
          </div>
          <div className={styles.foodCardContent}>
            <h4 className={styles.foodTitle}>{item.title}</h4>
            {(item.category || item.subtype) && (
              <p className={styles.foodSubtitle}>
                {item.category}
                {item.subtype ? ` • ${item.subtype}` : ''}
              </p>
            )}
            {item.description && (
              <div className={styles.foodDescriptionContainer}>
                <p ref={descriptionRef} className={styles.foodDescription}>{item.description}</p>
                {isDescriptionTruncated && (
                  <button
                    className={styles.readMoreButton}
                    onClick={handleReadMore}
                  >
                    Read More
                  </button>
                )}
              </div>
            )}
          </div>
          {userId && (
            <div className={styles.foodCardActions}>
              <p className={styles.foodPrice}>₹{item.price}</p>
              <div className={styles.quantityControls}>
                <button
                  className={`${styles.quantityButton} ${quantity === 0 ? styles.disabled : ''}`}
                  onClick={handleDecreaseQuantity}
                  disabled={loading || quantity === 0}
                >
                  {loading ? <Loader2 className={styles.spinner} size={16} /> : <Minus size={16} />}
                </button>
                <span className={styles.quantity}>{quantity}</span>
                <button
                  className={styles.quantityButton}
                  onClick={handleIncreaseQuantity}
                  disabled={loading}
                >
                  {loading ? <Loader2 className={styles.spinner} size={16} /> : <Plus size={16} />}
                </button>
              </div>
              {quantity === 0 && (
                <button
                  className={`${styles.addToCartButton} ${loading ? styles.loading : ''}`}
                  data-theme-component="button.addToCart"
                  onClick={handleAddToCart}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className={styles.spinner} size={16} />
                      Adding...
                    </>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <VendorModal
        show={showVendorModal}
        availableVendors={availableVendors}
        selectedVendor={selectedVendor}
        onVendorSelect={handleVendorSelect}
        onConfirm={handleVendorConfirm}
        onCancel={handleCancel}
      />

      <ItemDetailModal
        show={showItemDetailModal}
        item={item}
        categories={categories}
        userId={userId}
        onClose={handleCloseItemDetailModal}
      />
    </>
  );
};

export default ProductCard; 