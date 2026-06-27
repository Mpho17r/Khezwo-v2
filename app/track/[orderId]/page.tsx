import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VendorBrandHeader, PoweredByKhezwo } from "@/components/vendor-brand-header";
import { OrderTracker } from "./tracker";
import type { Vendor } from "@/lib/types";

export default async function TrackOrderPage({ params }: { params: { orderId: string } }) {
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .single();

  if (!order) notFound();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", order.vendor_id)
    .single();

  if (!vendor) notFound();

  return (
    <main className="min-h-screen bg-neutral-50">
      <VendorBrandHeader vendor={vendor as Vendor} />

      <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-center font-display text-xl font-bold text-neutral-800">
          Order #{order.order_number}
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          {order.customer_name} · updates live, no need to refresh
        </p>

        <OrderTracker
          orderId={order.id}
          initialStatus={order.status}
          primaryColor={vendor.primary_color}
        />
      </div>

      <PoweredByKhezwo />
    </main>
  );
}
