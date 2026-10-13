import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VendorBrandHeader, PoweredByKhezwo } from "@/components/vendor-brand-header";
import { formatZAR } from "@/lib/utils";
import type { Vendor } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

type ReceiptItem = {
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_public_order_receipt", {
    p_tracking_token: orderId,
  });
  const receipt = Array.isArray(data) ? data[0] : null;

  if (error || !receipt || receipt.vendor_slug !== slug) notFound();

  const vendor = {
    name: receipt.vendor_name,
    logo_url: receipt.vendor_logo_url,
    primary_color: receipt.vendor_primary_color,
    secondary_color: receipt.vendor_secondary_color,
  } as Vendor;

  const items = (receipt.items ?? []) as ReceiptItem[];

  return (
    <main className="min-h-screen bg-neutral-50">
      <VendorBrandHeader vendor={vendor} />

      <div className="mx-auto max-w-md px-4 py-8 text-center sm:px-6">
        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
        <h1 className="font-display text-2xl font-bold text-neutral-800">
          Order #{receipt.order_number} placed!
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Estimated wait: about {receipt.estimated_wait_minutes} minutes.
        </p>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 text-left">
          <ul className="space-y-1 text-sm text-neutral-600">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.quantity}× {item.name_snapshot}</span>
                <span>{formatZAR(Number(item.price_snapshot) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-800">
            <span>Total</span>
            <span>{formatZAR(Number(receipt.total))}</span>
          </div>
        </div>

        <Link
          href={`/track/${orderId}`}
          className="mt-6 inline-block w-full rounded-lg py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: receipt.vendor_primary_color }}
        >
          Track my order
        </Link>
      </div>

      <PoweredByKhezwo />
    </main>
  );
}
