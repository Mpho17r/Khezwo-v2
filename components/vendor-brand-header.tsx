import Image from "next/image";
import type { Vendor } from "@/lib/types";

/**
 * What a CUSTOMER sees at the top of a vendor's menu/tracking page.
 * Deliberately the opposite of <KhezwoLogo />: this is the vendor's own
 * logo and brand color, full size and unmissable. KheZwo appears nowhere
 * here except the tiny "Powered by" credit footer (see PoweredByKhezwo).
 */
export function VendorBrandHeader({ vendor }: { vendor: Vendor }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-5 sm:px-6"
      style={{ backgroundColor: vendor.primary_color }}
    >
      {vendor.logo_url ? (
        <Image
          src={vendor.logo_url}
          alt={vendor.name}
          width={48}
          height={48}
          className="rounded-full bg-white object-cover"
        />
      ) : (
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold"
          style={{ color: vendor.primary_color }}
        >
          {vendor.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="font-display text-lg font-bold text-white">{vendor.name}</h1>
      </div>
    </div>
  );
}

/** Small, unobtrusive footer credit — appears under the customer-facing flow only. */
export function PoweredByKhezwo() {
  return (
    <p className="py-6 text-center text-xs text-neutral-400">
      Powered by{" "}
      <span className="font-semibold text-neutral-500">KheZwo</span>
    </p>
  );
}
