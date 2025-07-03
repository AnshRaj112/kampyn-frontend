// /types/inventory.ts

export interface ApiEntry {
  item: { _id: string; name: string };
  openingQty: number;
  soldQty: number;
  closingQty: number;
}

export interface ApiReport {
  vendor: { _id: string; fullName: string };
  date: string;
  // entries may be missing when no report exists
  retailEntries?: ApiEntry[];
  produceEntries?: ApiEntry[];
  // ...you can add rawEntries etc later
}

export interface InventoryItem {
  name: string;
  opening: number;
  received: number;
  sold: number;
  closing: number;
  itemType: "Retail" | "Produce";
}

export interface InventoryStats {
  totalTracked: number;
  soldToday: number;
  receivedToday: number;
}

export function transformApiReport(r: ApiReport) {
  // guard against missing arrays
  const retailEntries = r.retailEntries ?? [];
  const produceEntries = r.produceEntries ?? [];

  const retailItems: InventoryItem[] = retailEntries.map((e) => ({
    name: e.item.name,
    opening: e.openingQty,
    sold: e.soldQty,
    closing: e.closingQty,
    // received = closing − opening + sold
    received: e.closingQty - e.openingQty + e.soldQty,
    itemType: "Retail",
  }));

  const produceItems: InventoryItem[] = produceEntries.map((e) => ({
    name: e.item.name,
    opening: 0,
    sold: e.soldQty,
    closing: 0,
    received: 0,
    itemType: "Produce",
  }));

  const items = [...retailItems, ...produceItems];

  const stats: InventoryStats = {
    totalTracked: items.length,
    soldToday: items.reduce((sum, i) => sum + i.sold, 0),
    receivedToday: items.reduce((sum, i) => sum + i.received, 0),
  };

  return {
    items,
    stats,
    reportDate: r.date,
    vendorName: r.vendor.fullName,
    vendorId: r.vendor._id,
  };
}

export interface InventoryReport {
  items: InventoryItem[];
  stats: InventoryStats;
  reportDate: string;
  vendorName: string;
  vendorId: string;
}
export type OrderType = "delivery" | "takeaway" | "dinein" | "cash";

export type Status =
  | "pendingPayment"
  | "inProgress"
  | "onTheWay"
  | "delivered"
  | "failed";

export interface Item {
  itemId: string;
  kind: "Retail" | "Produce";
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  collectorName: string;
  collectorPhone: string;
  orderType: OrderType;
  address?: string;
  status: Status;
  items: Item[];
  total: number;
}

// Vendor Cart Types
export interface VendorCartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  kind: "Retail" | "Produce";
  type: string;
  isSpecial?: "Y" | "N";
  isAvailable?: "Y" | "N";
}

export interface VendorCart {
  items: VendorCartItem[];
  total: number;
}

export interface BillingFormData {
  userName: string;
  phoneNumber: string;
  paymentMethod: "cash" | "upi";
}

export interface GuestOrderRequest {
  vendorId: string;
  items: VendorCartItem[];
  total: number;
  collectorName: string;
  collectorPhone: string;
  orderType: "cash" | "upi";
  isGuest: boolean;
}

export interface GuestOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  message: string;
  isNewUser?: boolean;
}
