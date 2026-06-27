"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutGrid, UtensilsCrossed, Palette, BarChart3 } from "lucide-react";
import { KhezwoLogo } from "./khezwo-logo";
import { SaccharumWatermark } from "./saccharum-watermark";
import { LogoutButton } from "./logout-button";

const LINKS = [
  { href: "/vendor/dashboard", label: "Live orders", icon: LayoutGrid },
  { href: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/vendor/branding", label: "Branding & QR", icon: Palette },
  { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
];

export function VendorNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-khezwo-ink px-4 py-6">
      <div className="px-2">
        <KhezwoLogo size="sm" href="/vendor/dashboard" />
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-neutral-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-2">
        <LogoutButton />
        <SaccharumWatermark className="text-neutral-500" />
      </div>
    </aside>
  );
}
