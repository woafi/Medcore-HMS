import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";
import SideNav from "@/components/SideNav";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-gray-900 dark:text-gray-100">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
