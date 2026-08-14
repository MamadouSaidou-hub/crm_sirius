import type { Metadata } from "next";
import { MockUserProvider } from "@/lib/mock-auth";
import { SyncProvider } from "@/lib/offline/sync-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  // Prevent accidental indexing of internal app pages
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockUserProvider>
      <SyncProvider>
        <AppShell>{children}</AppShell>
      </SyncProvider>
    </MockUserProvider>
  );
}
