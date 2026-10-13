"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartLine, PaymentMethod } from "@/lib/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function placeOrder({
  vendorId,
  customerName,
  paymentMethod,
  cart,
}: {
  vendorId: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  cart: CartLine[];
}) {
  if (typeof vendorId !== "string" || !UUID_PATTERN.test(vendorId)) {
    throw new Error("Invalid business.");
  }

  if (typeof customerName !== "string" || !customerName.trim() || customerName.trim().length > 120) {
    throw new Error("Enter a name of 1 to 120 characters.");
  }

  if (paymentMethod !== "cash" && paymentMethod !== "card") {
    throw new Error("Choose a valid payment method.");
  }

  if (!Array.isArray(cart) || cart.length < 1 || cart.length > 50) {
    throw new Error("Your order must contain between 1 and 50 cart lines.");
  }

  const safeCart = cart.map((line) => {
    if (!line || typeof line !== "object") throw new Error("Invalid cart item.");
    if (typeof line.menuItemId !== "string" || !UUID_PATTERN.test(line.menuItemId)) {
      throw new Error("Invalid menu item.");
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 50) {
      throw new Error("Item quantities must be between 1 and 50.");
    }
    if (line.notes !== undefined && (typeof line.notes !== "string" || line.notes.length > 500)) {
      throw new Error("Item notes must be 500 characters or fewer.");
    }

    // Browser-supplied names and prices are deliberately discarded.
    return {
      menuItemId: line.menuItemId,
      quantity: line.quantity,
      notes: line.notes?.trim() || null,
    };
  });

  const ids = safeCart.map((line) => line.menuItemId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Please combine duplicate items before checking out.");
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("place_public_order", {
    p_vendor_id: vendorId,
    p_customer_name: customerName.trim(),
    p_payment_method: paymentMethod,
    p_items: safeCart,
  });

  if (error || !Array.isArray(data) || !data[0]?.created_tracking_token) {
    // Do not return database internals to an anonymous customer.
    throw new Error(
      error?.message?.includes("unavailable") || error?.message?.includes("not accepting")
        ? "This business or one of your items is no longer available. Refresh the menu and try again."
        : error?.message?.includes("quantity") || error?.message?.includes("cart")
          ? "Please check your cart and try again."
          : "We couldn't place your order. Please refresh and try again."
    );
  }

  // Only return the opaque tracking token to the customer-facing client.
  return {
    trackingToken: data[0].created_tracking_token as string,
  };
}
