import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
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
        <Navbar />
        {/* pb-20 on mobile clears the bottom nav; md resets it. */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
