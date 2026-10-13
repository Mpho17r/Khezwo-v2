export const dynamic = "force-dynamic";

import { AdminNav } from "@/components/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-khezwo-cream">
      <AdminNav />
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</div>
    </div>
  );
}
