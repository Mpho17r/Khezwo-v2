import Image from "next/image";
import Link from "next/link";

/**
 * The KheZwo logo is the FACE of the product.
 * Per brand rules, only render this on:
 *  - the landing / registration page
 *  - the vendor dashboard
 *  - the admin dashboard
 * Never on customer-facing order/track pages — those belong to the vendor's
 * own branding. See <VendorBrandHeader /> for that context instead.
 */
export function KhezwoLogo({
  size = "md",
  withWordmark = true,
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  href?: string | null;
}) {
  const px = { sm: 28, md: 36, lg: 56 }[size];

  const content = (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/khezwo-logo.jpg"
        alt="KheZwo"
        width={px}
        height={px}
        className="rounded-md"
        priority
      />
      {withWordmark && (
        <span
          className="font-display font-bold tracking-tight text-khezwo-ink"
          style={{ fontSize: px * 0.5 }}
        >
          KheZwo
        </span>
      )}
    </span>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
