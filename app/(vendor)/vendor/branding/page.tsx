import { getCurrentVendor } from "@/lib/queries";
import { BrandingForm } from "./branding-form";
import { QrCodeCard } from "@/components/qr-code-card";

export default async function VendorBrandingPage() {
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold text-khezwo-ink">
          Branding &amp; QR code
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          This is what your customers see — not KheZwo&apos;s branding. Make it
          feel like {vendor.name}.
        </p>
        <BrandingForm vendor={vendor} />
      </div>
      <div>
        <h2 className="mb-1 font-display text-2xl font-bold text-khezwo-ink opacity-0 lg:opacity-100">
          &nbsp;
        </h2>
        <QrCodeCard slug={vendor.slug} />
      </div>
    </div>
  );
}
