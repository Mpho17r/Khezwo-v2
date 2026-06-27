import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { VendorBrandHeader, PoweredByKhezwo } from "@/components/vendor-brand-header";
import { formatZAR } from "@/lib/utils";
import type { Vendor } from "@/lib/types";
import { CheckCircle2 } from "lucide-react";

export default async function OrderConfirmationPage({
  params,
}: {
  params: { slug: string; orderId: string };
}) {
  const supabase = createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("slug", params.slug)
    .single();

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", params.orderId)
    .single();

  if (!vendor || !order) notFound();

  return (
    <main className="min-h-screen bg-neutral-50">
      <VendorBrandHeader vendor={vendor as Vendor} />

      <div className="mx-auto max-w-md px-4 py-8 text-center sm:px-6">
        <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
        <h1 className="font-display text-2xl font-bold text-neutral-800">
          Order #{order.order_number} placed!
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Estimated wait: about {order.estimated_wait_minutes} minutes.
        </p>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 text-left">
          <ul className="space-y-1 text-sm text-neutral-600">
            {order.order_items.map((item: any) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.quantity}× {item.name_snapshot}
                </span>
                <span>{formatZAR(item.price_snapshot * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-800">
            <span>Total</span>
            <span>{formatZAR(order.total)}</span>
          </div>
        </div>

        <Link
          href={`/track/${order.id}`}
          className="mt-6 inline-block w-full rounded-lg py-3 text-sm font-semibold text-white"
          style={{ backgroundColor: vendor.primary_color }}
        >
          Track my order
        </Link>
      </div>

      <PoweredByKhezwo />
    </main>
  );
}
