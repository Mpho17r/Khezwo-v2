import Link from "next/link";
import { QrCode, Smartphone, BarChart3, Wallet } from "lucide-react";
import { KhezwoLogo } from "@/components/khezwo-logo";
import { SaccharumWatermark } from "@/components/saccharum-watermark";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-khezwo-cream">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <KhezwoLogo size="md" href="/" />
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/login" className="text-khezwo-ink/70 hover:text-khezwo-ink">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-khezwo-ink px-4 py-2 text-white hover:opacity-90"
          >
            Get started free
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:pt-24">
        <span className="inline-block rounded-full bg-khezwo-gold/20 px-3 py-1 text-xs font-semibold text-khezwo-ink">
          Built for South African small businesses
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-khezwo-ink sm:text-5xl">
          Scan. Order. Done.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-khezwo-ink/70">
          Turn any smartphone into a full ordering system. No POS hardware, no
          app to download — just a QR code on the table.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-khezwo-red px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90"
          >
            Register your business
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-khezwo-ink/15 px-6 py-3 font-semibold text-khezwo-ink hover:bg-white"
          >
            I already have an account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 pb-20 sm:grid-cols-4">
        {[
          {
            icon: QrCode,
            title: "Scan to order",
            body: "Customers scan a table QR code and order straight from their own phone.",
          },
          {
            icon: Smartphone,
            title: "No POS needed",
            body: "Any business with a smartphone can start taking digital orders today.",
          },
          {
            icon: BarChart3,
            title: "Real data",
            body: "See top sellers, peak hours, and revenue trends as they happen.",
          },
          {
            icon: Wallet,
            title: "Free to start",
            body: "Up to 20 menu items at no cost. Upgrade only when you outgrow it.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-khezwo-ink/10 bg-white p-5">
            <Icon className="text-khezwo-green" size={22} />
            <h3 className="mt-3 font-display font-semibold text-khezwo-ink">{title}</h3>
            <p className="mt-1 text-sm text-khezwo-ink/60">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-khezwo-ink/10 px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-xs text-khezwo-ink/40">© {new Date().getFullYear()} KheZwo</p>
          <SaccharumWatermark />
        </div>
      </footer>
    </main>
  );
}
