import Link from "next/link";
import { KhezwoLogo } from "@/components/khezwo-logo";
import { register } from "./actions";

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-khezwo-cream px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <KhezwoLogo size="lg" href="/" />
        </div>

        <div className="rounded-2xl border border-khezwo-ink/10 bg-white p-6 shadow-sm">
          <h1 className="font-display text-xl font-bold text-khezwo-ink">
            Register your business
          </h1>
          <p className="mt-1 text-sm text-khezwo-ink/60">
            Free to start. No card needed.
          </p>

          {searchParams?.error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {searchParams.error}
            </p>
          )}

          <form action={register} className="mt-5 space-y-3">
            <div>
              <label className="text-sm font-medium text-khezwo-ink">Business name</label>
              <input
                name="businessName"
                type="text"
                required
                placeholder="e.g. Thandi's Kitchen"
                className="mt-1 w-full rounded-lg border border-khezwo-ink/15 px-3 py-2 text-sm focus:border-khezwo-green focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-khezwo-ink">Email</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-khezwo-ink/15 px-3 py-2 text-sm focus:border-khezwo-green focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-khezwo-ink">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-khezwo-ink/15 px-3 py-2 text-sm focus:border-khezwo-green focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-khezwo-red py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Create my account
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-khezwo-ink/60">
            Already on KheZwo?{" "}
            <Link href="/login" className="font-medium text-khezwo-green">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
