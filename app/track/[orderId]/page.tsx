import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VendorBrandHeader, PoweredByKhezwo } from "@/components/vendor-brand-header";
import { OrderTracker } from "./tracker";
import type { Vendor, OrderStatus } from "@/lib/types";

export default async function TrackOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  // The route segment is an opaque tracking token, not the internal order UUID.
  const supabase = await createClient();
  const [{ data: receiptData, error: receiptError }, { data: statusData, error: statusError }] =
    await Promise.all([
      supabase.rpc("get_public_order_receipt", { p_tracking_token: orderId }),
      supabase.rpc("get_public_order_status", { p_tracking_token: orderId }),
    ]);

  const receipt = Array.isArray(receiptData) ? receiptData[0] : null;
  const status = Array.isArray(statusData) ? statusData[0] : null;
  if (receiptError || statusError || !receipt || !status) notFound();

  const vendor = {
    name: receipt.vendor_name,
    logo_url: receipt.vendor_logo_url,
    primary_color: receipt.vendor_primary_color,
    secondary_color: receipt.vendor_secondary_color,
  } as Vendor;

  return (
    <main className="min-h-screen bg-neutral-50">
      <VendorBrandHeader vendor={vendor} />

      <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-center font-display text-xl font-bold text-neutral-800">
          Order #{status.order_number}
        </h1>
        <p className="mb-6 text-center text-sm text-neutral-500">
          Order status updates automatically. Keep this link private.
        </p>

        <OrderTracker
          trackingToken={orderId}
          initialStatus={status.status as OrderStatus}
          primaryColor={status.primary_color}
        />
      </div>

      <PoweredByKhezwo />
    </main>
  );
}
