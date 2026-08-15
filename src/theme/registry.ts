/**
 * Frontend mirror of kampyn-backend/theme/themeRegistry.js
 * Keep IDs and defaults in sync when extending the catalog.
 */

export const THEME_SCHEMA_VERSION = 1;

export const ALLOWED_FONTS = [
  "Poppins",
  "Inter",
  "Outfit",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
] as const;

export const DEFAULT_TOKENS = {
  color: {
    primary: "#01796f",
    secondary: "#4ea199",
    accent: "#01796f",
    background: "#D6E6F3",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textMuted: "#64748b",
    textInverse: "#ffffff",
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    info: "#0284c7",
  },
  typography: {
    fontFamily: "Poppins",
    fontFamilyDisplay: "Poppins",
    fontSizeBase: "16px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "700",
    lineHeight: "1.5",
  },
  shape: {
    radiusSm: "0.25rem",
    radiusMd: "0.5rem",
    radiusLg: "0.75rem",
    radiusFull: "9999px",
  },
  elevation: {
    shadowSm: "0 1px 2px rgba(15, 23, 42, 0.06)",
    shadowMd: "0 4px 12px rgba(15, 23, 42, 0.08)",
    shadowLg: "0 12px 32px rgba(15, 23, 42, 0.12)",
  },
  assets: {
    logo: "",
    favicon: "",
  },
} as const;

export const PAGE_IDS = [
  "home",
  "restaurant",
  "menu",
  "cart",
  "checkout",
  "orders",
  "wallet",
  "membership",
  "profile",
  "login",
  "signup",
  "vendorDashboard",
  "uniDashboard",
  "analytics",
  "settings",
  "search",
  "favorites",
  "guestHouse",
  "auditorium",
] as const;

export const PAGE_PROPS = ["background", "surface", "text", "accent"] as const;

export const COMPONENT_CATALOG = {
  card: {
    label: "Cards",
    ids: [
      "home",
      "college",
      "dish",
      "restaurant",
      "vendor",
      "membership",
      "wallet",
      "analytics",
      "statistics",
      "offer",
      "coupon",
      "category",
      "cartItem",
      "bill",
      "profile",
      "order",
      "notification",
    ],
    props: [
      "background",
      "border",
      "radius",
      "shadow",
      "hoverBackground",
      "hoverShadow",
      "title",
      "description",
      "price",
      "badge",
    ],
  },
  button: {
    label: "Buttons",
    ids: [
      "primary",
      "secondary",
      "destructive",
      "ghost",
      "addToCart",
      "checkout",
      "buyNow",
      "login",
      "signup",
      "save",
      "cancel",
      "delete",
      "confirm",
      "continue",
      "pay",
      "applyCoupon",
      "viewDetails",
      "trackOrder",
    ],
    props: ["background", "text", "border", "radius", "hover", "disabled", "active", "icon"],
  },
  nav: {
    label: "Navigation",
    ids: ["navbar", "sidebar", "bottomNav", "drawer", "breadcrumbs", "tabs"],
    props: ["background", "active", "inactive", "hover", "indicator"],
  },
  form: {
    label: "Forms",
    ids: ["input", "select", "checkbox", "radio", "switch", "datePicker", "search"],
    props: ["background", "border", "focus", "placeholder", "label", "error", "success"],
  },
  table: {
    label: "Tables",
    ids: ["default"],
    props: ["header", "row", "alternateRow", "hover", "border", "pagination", "sortIndicator"],
  },
  dialog: {
    label: "Dialogs",
    ids: ["default"],
    props: ["background", "header", "footer", "overlay", "closeButton"],
  },
  alert: {
    label: "Alerts",
    ids: ["success", "warning", "error", "info"],
    props: ["background", "border", "text", "icon"],
  },
  badge: {
    label: "Badges",
    ids: ["new", "popular", "veg", "nonVeg", "bestseller", "premium", "discount"],
    props: ["background", "text", "border"],
  },
  icon: {
    label: "Icons",
    ids: ["default"],
    props: ["default", "active", "disabled"],
  },
  chart: {
    label: "Charts",
    ids: ["default"],
    props: ["line", "bar", "pie", "axis", "grid", "tooltip"],
  },
  misc: {
    label: "Miscellaneous",
    ids: [
      "chip",
      "tag",
      "accordion",
      "tooltip",
      "progress",
      "skeleton",
      "loader",
      "emptyState",
      "timeline",
      "toast",
      "pagination",
      "footer",
      "header",
      "fab",
      "divider",
    ],
    props: ["background", "border", "text", "accent"],
  },
} as const;

export type PageId = (typeof PAGE_IDS)[number];
export type ComponentCategory = keyof typeof COMPONENT_CATALOG;

export type ThemeTokens = {
  color?: Partial<Record<keyof typeof DEFAULT_TOKENS.color, string>>;
  typography?: Partial<Record<keyof typeof DEFAULT_TOKENS.typography, string>>;
  shape?: Partial<Record<keyof typeof DEFAULT_TOKENS.shape, string>>;
  elevation?: Partial<Record<keyof typeof DEFAULT_TOKENS.elevation, string>>;
  assets?: Partial<Record<keyof typeof DEFAULT_TOKENS.assets, string>>;
};

export type ThemeDocument = {
  version?: number;
  tokens?: ThemeTokens;
  pages?: Partial<Record<PageId, Partial<Record<(typeof PAGE_PROPS)[number], string>>>>;
  components?: {
    [K in ComponentCategory]?: Partial<
      Record<
        (typeof COMPONENT_CATALOG)[K]["ids"][number],
        Partial<Record<(typeof COMPONENT_CATALOG)[K]["props"][number], string>>
      >
    >;
  };
};

export function getDefaultTheme(): ThemeDocument {
  return {
    version: THEME_SCHEMA_VERSION,
    tokens: JSON.parse(JSON.stringify(DEFAULT_TOKENS)),
    pages: {},
    components: {},
  };
}

export function tokenCssVar(group: string, key: string) {
  return `--kampyn-${group}-${key}`;
}

export function pageCssVar(pageId: string, prop: string) {
  return `--kampyn-page-${pageId}-${prop}`;
}

export function componentCssVar(category: string, id: string, prop: string) {
  return `--kampyn-component-${category}-${id}-${prop}`;
}
