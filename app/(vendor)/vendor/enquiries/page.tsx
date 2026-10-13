import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/queries";
import { EnquiryStatusControl } from "./status-control";

export const dynamic = "force-dynamic";

export default async function VendorEnquiriesPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  const supabase = await createClient();
  const { data: enquiries, error } = await supabase
    .from("service_enquiries")
    .select("id, customer_name, contact_value, message, status, created_at, menu_items(name)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  return (
    <main>
      <h1 className="font-display text-2xl font-bold text-khezwo-ink">Service enquiries</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">Review customer requests for your services and track follow-ups.</p>
      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Enquiries are not available yet. Apply the Stage 3 catalogue migration to your test database first.
        </div>
      ) : !enquiries?.length ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
          <h2 className="font-semibold text-khezwo-ink">No enquiries yet</h2>
          <p className="mt-1 text-sm text-neutral-500">When a customer enquires about one of your services, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((enquiry) => {
            const item = Array.isArray(enquiry.menu_items) ? enquiry.menu_items[0] : enquiry.menu_items;
            return (
              <article key={enquiry.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-khezwo-ink">{enquiry.customer_name}</p>
                    <p className="text-sm text-neutral-500">{enquiry.contact_value}</p>
                    <p className="mt-2 text-sm"><span className="text-neutral-500">Service:</span> {item?.name ?? "Service listing"}</p>
                  </div>
                  <EnquiryStatusControl enquiryId={enquiry.id} status={enquiry.status as "new" | "contacted" | "closed"} />
                </div>
                {enquiry.message && <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{enquiry.message}</p>}
                <p className="mt-3 text-xs text-neutral-400">{new Date(enquiry.created_at).toLocaleString()}</p>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
