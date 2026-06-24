export interface FoodItem {
  id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  type: string;
  subtype?: string;
  isSpecial: string;
  collegeId?: string;
  collegeName?: string;
  price: number;
  vendorId?: string | null;
  quantity?: number;
  isAvailable?: string;
  isVeg?: boolean | string;
  source?: string;
}

export interface FavoriteItem {
  _id: string;
  name: string;
  type: string;
  subtype?: string;
  uniId: string;
  price: number;
  image: string;
  isSpecial: string;
  kind: string;
  vendorId: string;
}

export interface CartItem {
  _id: string;
  itemId: string;
  quantity: number;
  kind: string;
  vendorId: string;
  vendorName: string;
}

export interface Vendor {
  _id: string;
  name: string;
  price: number;
  quantity?: number;
  isAvailable?: string;
  inventoryValue?: {
    price: number;
    quantity?: number;
    isAvailable?: string;
    isSpecial?: string;
  };
}

export interface College {
  _id: string;
  fullName: string;
  slug?: string;
  retailImage?: string;
  produceImage?: string;
  categoryImages?: { name: string; image: string }[];
}

export interface ApiFavoritesResponse {
  favourites: FavoriteItem[];
}

export interface ApiItem {
  _id: string;
  name: string;
  description?: string;
  image: string;
  type: string;
  subtype?: string;
  isSpecial: string;
  collegeId?: string;
  category?: string;
  price: number;
  vendorId?: string;
}

export interface CollegeVendor {
  _id: string;
  fullName: string;
  sellerType?: "SELLER" | "NON_SELLER";
  image?: string;
  coverImage?: string;
  retailInventory: {
    itemId: string;
    quantity: number;
    isAvailable?: string; // Some retail items might use this too?
  }[];
  produceInventory: {
    itemId: string;
    isAvailable: string;
  }[];
  isAvailable?: string; // Vendor global availability
}