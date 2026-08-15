import React, { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CartItem, OrderData, OrderType } from "../../../cart/types";
import {
  BillingFetcher,
  calculateBillTotals,
  defaultCharges,
  fetchBillingContext,
  hasNonPackableProduce,
  VendorDeliverySettings,
} from "./billingLogic";

type BillBoxStyles = Record<string, string>;

interface BillBoxFormProps {
  userId: string;
  items: CartItem[];
  styles: BillBoxStyles;
  submitLabel: string;
  fetchData: BillingFetcher;
  onSubmitOrder: (payload: OrderData) => Promise<void>;
}

const BillBoxForm: React.FC<BillBoxFormProps> = ({
  userId,
  items,
  styles,
  submitLabel,
  fetchData,
  onSubmitOrder,
}) => {
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [charges, setCharges] = useState(defaultCharges);
  const [vendorDeliverySettings, setVendorDeliverySettings] = useState<VendorDeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBillingContext = async () => {
      setLoading(true);
      try {
        const context = await fetchBillingContext(userId, fetchData);
        setCharges(context.charges);
        setVendorDeliverySettings(context.vendorDeliverySettings);
      } catch (error) {
        console.error("Failed to fetch charges and delivery settings:", error);
        setCharges({ packingCharge: 5, deliveryCharge: 50, platformFee: 2 });
      } finally {
        setLoading(false);
      }
    };

    loadBillingContext();
  }, [fetchData, userId]);

  useEffect(() => {
    if (vendorDeliverySettings && !vendorDeliverySettings.offersDelivery && orderType === "delivery") {
      setOrderType("takeaway");
    }
  }, [vendorDeliverySettings, orderType]);

  const nonPackableProduceInCart = hasNonPackableProduce(items);

  useEffect(() => {
    if (nonPackableProduceInCart && orderType !== "dinein") {
      setOrderType("dinein");
    }
  }, [nonPackableProduceInCart, orderType]);

  const { packableItems, packingCharge, platformFee, packaging, delivery, grandTotal } =
    calculateBillTotals(items, orderType, charges);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim() || (orderType === "delivery" && !address.trim())) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload: OrderData = {
      orderType,
      collectorName: name,
      collectorPhone: phone,
      ...(orderType === "delivery" ? { address } : {}),
    };

    await onSubmitOrder(payload);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
        <span>Loading bill details...</span>
      </div>
    );
  }

  return (
    <form
      className={styles.container}
      onSubmit={handleSubmit}
      data-theme-component="card.bill"
    >
      {vendorDeliverySettings && (
        <div className={styles.preparationTime} style={{ marginBottom: "0.5rem" }}>
          <span>Estimated preparation time</span>
          <span>{vendorDeliverySettings.deliveryPreparationTime} minutes</span>
        </div>
      )}
      <div className={styles.segmentedControl}>
        {(["takeaway", "delivery", "dinein"] as OrderType[])
          .filter((type) => !(type === "delivery" && vendorDeliverySettings && !vendorDeliverySettings.offersDelivery))
          .map((type) => {
            const isDisabledByPackable = nonPackableProduceInCart && type !== "dinein";
            return (
              <button
                key={type}
                type="button"
                className={orderType === type ? styles.active : styles.segment}
                onClick={() => !isDisabledByPackable && setOrderType(type)}
                style={isDisabledByPackable ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                disabled={isDisabledByPackable}
              >
                {type === "takeaway" ? "Takeaway" : type === "delivery" ? "Delivery" : "Dine In"}
              </button>
            );
          })}
      </div>
      {nonPackableProduceInCart && (
        <p style={{ color: "#e67e22", fontSize: "0.82rem", marginTop: "0.25rem", marginBottom: "0.25rem" }}>
          {"\u26A0\uFE0F"} Dine In only - your cart contains non-packable items
        </p>
      )}

      <input
        className={styles.input}
        placeholder="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <input
        className={styles.input}
        placeholder="Phone"
        type="tel"
        maxLength={10}
        pattern="[0-9]{10}"
        value={phone}
        onChange={(event) => {
          const value = event.target.value.replace(/\D/g, "");
          if (value.length <= 10) {
            setPhone(value);
          }
        }}
        required
      />

      {orderType === "delivery" && (
        <textarea
          className={styles.textarea}
          placeholder="Delivery Address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
        />
      )}

      <div className={styles.bill}>
        <div className={styles.items}>
          {items.map((item) => (
            <div key={item._id} className={styles.line}>
              <span>
                {item.name} x{item.quantity}
              </span>
              <span>{`\u20B9${item.price * item.quantity}`}</span>
            </div>
          ))}
        </div>

        <div className={styles.totalPack}>
          {orderType !== "dinein" && packableItems.length > 0 && (
            <>
              {packableItems.map((item) => (
                <div key={item._id} className={styles.extra}>
                  <span>Packaging - {item.name}</span>
                  <span>{`\u20B9${packingCharge * item.quantity}`}</span>
                </div>
              ))}
              <div className={styles.extra}>
                <span>
                  Total Packaging ({packableItems.length} item{packableItems.length > 1 ? "s" : ""})
                </span>
                <span>{`\u20B9${packaging}`}</span>
              </div>
            </>
          )}

          {orderType === "delivery" && (
            <div className={styles.extra}>
              <span>Delivery Charge</span>
              <span>{`\u20B9${delivery}`}</span>
            </div>
          )}

          <div className={styles.extra}>
            <span>Platform Fee</span>
            <span>{`\u20B9${platformFee}`}</span>
          </div>

          <div className={styles.divider} />

          <div className={styles.total}>
            <strong>Total</strong>
            <strong>{`\u20B9${grandTotal}`}</strong>
          </div>
        </div>
      </div>

      <button type="submit" className={styles.button}>
        {submitLabel}
      </button>
    </form>
  );
};

export default BillBoxForm;
