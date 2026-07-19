import { MockUserProvider } from "@/lib/mock-auth";
import { SyncProvider } from "@/lib/offline/sync-provider";
import { AppShell } from "@/components/layout/app-shell";

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
