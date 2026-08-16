"use client";

import { useEffect } from "react";
import { CART_STORAGE_KEY } from "@/lib/cart";

// Rendered on the order-confirmed page once payment has succeeded. The bag
// lives in localStorage on the storefront, so this is the first same-origin
// client render after checkout where we can safely empty it.
export function ClearCart() {
  useEffect(() => {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore storage access errors (private mode, disabled storage).
    }
  }, []);
  return null;
}
