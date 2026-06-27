"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LayoutGrid, Store, SlidersHorizontal } from "lucide-react";
import { KhezwoLogo } from "./khezwo-logo";
import { SaccharumWatermark } from "./saccharum-watermark";
import { LogoutButton } from "./logout-button";

const LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
  { href: "/admin/settings", label: "Platform settings", icon: SlidersHorizontal },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-khezwo-ink px-4 py-6">
      <div className="px-2">
        <KhezwoLogo size="sm" href="/admin/dashboard" />
        <span className="ml-1 mt-1 block text-[11px] font-semibold uppercase tracking-wide text-khezwo-gold">
          Admin
        </span>
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
        {/* This is the one spot where Saccharum gets a bit more presence —
            it's the operator's own back office, and all platform-level
            reporting lives behind this nav (Platform settings). */}
        <SaccharumWatermark className="text-neutral-500" />
      </div>
    </aside>
  );
}
