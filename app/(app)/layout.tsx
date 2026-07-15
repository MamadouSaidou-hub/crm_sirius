import { MockUserProvider } from "@/lib/mock-auth";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MockUserProvider>
      <AppShell>{children}</AppShell>
    </MockUserProvider>
  );
}
