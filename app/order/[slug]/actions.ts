"use server";

import { createClient } from "@/lib/supabase/server";
import type { CartLine, PaymentMethod } from "@/lib/types";

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
  if (!customerName.trim() || cart.length === 0) {
    throw new Error("Add at least one item and your name before checking out.");
  }

  const supabase = createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("platform_fee_percent, status")
    .eq("id", vendorId)
    .single();

  if (!vendor || vendor.status !== "active") {
    throw new Error("This business isn't accepting orders right now.");
  }

  const subtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const platformFee = Math.round(subtotal * (vendor.platform_fee_percent / 100) * 100) / 100;
  const total = subtotal + platformFee;

  // Compute the next per-vendor order number. Note: under very high
  // concurrent load this read-then-write has a small race window — for a
  // production launch beyond this MVP, move this into a DB function/sequence.
  const { data: lastOrder } = await supabase
    .from("orders")
    .select("order_number")
    .eq("vendor_id", vendorId)
    .order("order_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orderNumber = (lastOrder?.order_number ?? 0) + 1;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      vendor_id: vendorId,
      order_number: orderNumber,
      customer_name: customerName.trim(),
      payment_method: paymentMethod,
      subtotal,
      platform_fee: platformFee,
      total,
      status: "received",
    })
    .select()
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? "Could not place order");
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    cart.map((line) => ({
      order_id: order.id,
      menu_item_id: line.menuItemId,
      name_snapshot: line.name,
      price_snapshot: line.price,
      quantity: line.quantity,
      notes: line.notes ?? null,
    }))
  );

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return { orderId: order.id as string };
}
