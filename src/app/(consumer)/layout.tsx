import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ConsumerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <AppHeader />
      <main className="pb-24 sm:pb-10">{children}</main>
      <BottomNav />
    </div>
  );
}
