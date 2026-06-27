import { createServiceRoleClient } from "@/lib/supabase/server";
import { updatePlatformFee, addSponsorAd, toggleSponsorAd } from "./actions";
import { SaccharumWatermark } from "@/components/saccharum-watermark";
import Image from "next/image";

export default async function AdminSettingsPage() {
  const supabase = createServiceRoleClient();
  const { data: feeSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "default_platform_fee_percent")
    .single();
  const { data: ads } = await supabase
    .from("sponsor_ads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold text-khezwo-ink">
          Platform settings
        </h1>
        <p className="text-sm text-neutral-500">Defaults applied across all new vendors.</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-display font-semibold text-khezwo-ink">
          Default platform fee
        </h2>
        <form action={updatePlatformFee} className="flex items-center gap-3">
          <input
            name="percent"
            type="number"
            step="0.5"
            min="0"
            max="100"
            defaultValue={feeSetting?.value ?? 5}
            className="w-24 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <span className="text-sm text-neutral-500">% per order</span>
          <button
            type="submit"
            className="ml-auto rounded-lg bg-khezwo-ink px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Save
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-display font-semibold text-khezwo-ink">
          Direct sponsor ads
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          Local businesses you&apos;ve sold ad space to directly (R200–R500/month).
        </p>
        <form action={addSponsorAd} className="mb-4 flex gap-2">
          <input
            name="businessName"
            placeholder="Business name"
            required
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <input
            name="linkUrl"
            placeholder="Link (optional)"
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-khezwo-ink px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add
          </button>
        </form>
        <ul className="space-y-2">
          {(ads ?? []).map((ad) => (
            <li
              key={ad.id}
              className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
            >
              <span>{ad.business_name}</span>
              <ToggleAdForm adId={ad.id} active={ad.active} />
            </li>
          ))}
        </ul>
      </section>

      {/* Saccharum Technologies — the parent company gets its full presence
          and all platform-level reporting right here, in the admin's own
          back office. It is never shown to vendors or customers. */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <Image src="/saccharum-logo.png" alt="Saccharum Technologies" width={36} height={36} />
          <div>
            <h2 className="font-display font-semibold text-khezwo-ink">
              Saccharum Technologies
            </h2>
            <p className="text-xs text-neutral-400">Parent company · operator of KheZwo</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          All compliance, financial, and platform-activity reporting for KheZwo
          is filed under Saccharum Technologies as the operating entity.
        </p>
      </section>

      <SaccharumWatermark />
    </div>
  );
}

function ToggleAdForm({ adId, active }: { adId: string; active: boolean }) {
  return (
    <form action={async () => toggleSponsorAd(adId, !active)}>
      <button
        type="submit"
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          active ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
        }`}
      >
        {active ? "Live" : "Paused"}
      </button>
    </form>
  );
}
