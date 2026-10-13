import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VendorBrandHeader, PoweredByKhezwo } from "@/components/vendor-brand-header";
import { MenuClient } from "./menu-client";
import { isVendorOpen } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

export default async function CustomerOrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!vendor) notFound();

  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("sort_order", { ascending: true });

  const { data: ads } = await supabase
    .from("sponsor_ads")
    .select("*")
    .eq("active", true)
    .limit(1);

  const open = isVendorOpen((vendor as Vendor).business_hours);

  return (
    <main className="min-h-screen bg-neutral-50">
      <VendorBrandHeader vendor={vendor as Vendor} />

      {!open ? (
        <div className="mx-4 mt-6 rounded-xl border border-neutral-200 bg-white p-6 text-center sm:mx-6">
          <p className="font-medium text-neutral-700">
            {vendor.closing_message ?? "We're currently closed."}
          </p>
        </div>
      ) : (
        <>
          {ads && ads.length > 0 && (
            <a
              href={ads[0].link_url ?? "#"}
              className="mx-4 mt-3 block rounded-lg bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700 sm:mx-6"
            >
              Sponsored · {ads[0].business_name}
            </a>
          )}
          <MenuClient vendor={vendor as Vendor} items={items ?? []} />
        </>
      )}

      <PoweredByKhezwo />
    </main>
  );
}
