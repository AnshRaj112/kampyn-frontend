import { FoodItem } from "@/app/food/[slug]/types";

const DESCRIPTION_MAX_LENGTH = 100;

export const getDishDescription = (item: FoodItem) => {
  const description = item.description || "";
  const shouldTruncate = description.length > DESCRIPTION_MAX_LENGTH;

  return {
    description,
    shouldTruncate,
    truncatedDescription: shouldTruncate
      ? `${description.slice(0, DESCRIPTION_MAX_LENGTH)}...`
      : description,
  };
};

export const isDishInStock = (item: FoodItem) => {
  // `category` is retail|produce inventory kind.
  // `type` is the menu cuisine/group (Beverage, ITALIAN, etc.) — do NOT use it for stock.
  const inventoryKind = (item.category || item.type || "").toLowerCase();

  if (inventoryKind === "retail") {
    return item.quantity !== undefined ? item.quantity > 0 : true;
  }

  if (inventoryKind === "produce") {
    // Missing availability defaults to in-stock (matches retail's permissive default)
    if (item.isAvailable === undefined || item.isAvailable === null || item.isAvailable === "") {
      return true;
    }
    return String(item.isAvailable).toUpperCase() === "Y";
  }

  // Unknown kind: prefer quantity, then availability, else allow
  if (item.quantity !== undefined) return item.quantity > 0;
  if (item.isAvailable !== undefined && item.isAvailable !== null && item.isAvailable !== "") {
    return String(item.isAvailable).toUpperCase() === "Y";
  }
  return true;
};
