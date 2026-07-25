import type { PageId } from "./registry";

/**
 * Map app pathnames to theme pageIds for data-page scoping.
 */
export function pathnameToPageId(pathname: string): PageId | null {
  const path = (pathname || "/").toLowerCase().split("?")[0];

  if (path.includes("/admin-dashboard") || path.includes("/admin-login")) {
    return null; // platform admin — no tenant theme page scope
  }

  if (path === "/" || path.startsWith("/home")) return "home";
  if (path.startsWith("/food")) return "restaurant";
  if (path.startsWith("/vendor/") && !path.startsWith("/vendordashboard") && !path.startsWith("/vendor-")) {
    return "menu";
  }
  if (path.startsWith("/cart")) return "cart";
  if (path.startsWith("/payment")) return "checkout";
  if (path.startsWith("/activeorders") || path.startsWith("/pastorders")) return "orders";
  if (path.startsWith("/profile")) return "profile";
  if (
    path.includes("/login") ||
    path.includes("-login") ||
    path.includes("/otp") ||
    path.includes("/forgot") ||
    path.includes("/reset")
  ) {
    return "login";
  }
  if (path.startsWith("/signup")) return "signup";
  if (path.startsWith("/vendordashboard")) return "vendorDashboard";
  if (path.startsWith("/unidashboard") || path.startsWith("/food-ordering-uni")) return "uniDashboard";
  if (path.includes("analytics")) return "analytics";
  if (path.includes("settings")) return "settings";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/fav")) return "favorites";
  if (path.includes("guest-house")) return "guestHouse";
  if (path.includes("auditorium")) return "auditorium";

  return "home";
}
