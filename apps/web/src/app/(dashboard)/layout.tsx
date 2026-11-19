import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* No mobile brand bar: the Início hero bleeds to the top safe area
            instead (see WelcomeHeroMobile). pb-24 on mobile clears the
            bottom nav; md resets both. */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
