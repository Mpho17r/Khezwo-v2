"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import type { OrderStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const vendor = await getCurrentVendor();
  if (!vendor) throw new Error("You must be signed in as a vendor.");

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    throw new Error("Invalid order.");
  }

  const validStatuses: OrderStatus[] = [
    "received",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) throw new Error("Invalid order status.");

  const supabase = createClient();
  const { data: order, error: lookupError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (lookupError || !order) throw new Error("Order not found for this business.");
  if (!ALLOWED_TRANSITIONS[order.status as OrderStatus].includes(status)) {
    throw new Error("This order status transition is not allowed.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("vendor_id", vendor.id);

  if (error) throw new Error("Could not update order status.");
  revalidatePath("/vendor/dashboard");
}
