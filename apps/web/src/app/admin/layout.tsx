import { requireAdmin } from "@/lib/auth/require-admin";
import { AdminSidebar, AdminMobileBar } from "@/components/admin/admin-sidebar";

/**
 * Admin shell. Server-gated: anonymous users go to login, non-admins to the
 * app. Admins who still need to enroll in MFA are allowed through so they can
 * reach the activation wizard; the per-page gate forces enrollment elsewhere.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminMobileBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
