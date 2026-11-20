import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { AuthGate } from "./_components/auth-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen bg-[rgb(var(--bg))]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-4 pt-10 sm:p-6 sm:pt-10 md:pt-6 lg:p-8 print:!p-0 overflow-x-hidden print:overflow-visible animate-fade-in print:animate-none">
            <div className="max-w-[1600px] mx-auto w-full">{children}</div>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
