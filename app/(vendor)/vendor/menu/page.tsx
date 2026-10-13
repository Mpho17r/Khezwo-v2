import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { MenuEditor } from "./menu-editor";

const FREE_TIER_ITEM_LIMIT = 20;

export default async function VendorMenuPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold text-khezwo-ink">Menu</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Add, edit, and mark items out of stock. Changes show up for customers instantly.
      </p>
      <MenuEditor
        items={items ?? []}
        freeTierLimit={vendor.plan === "free" ? FREE_TIER_ITEM_LIMIT : null}
      />
    </div>
  );
}
