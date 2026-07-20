"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { OfflineBanner } from "@/components/offline/offline-banner";
import { InstallPrompt } from "@/components/offline/install-prompt";
import { countOverdueTasks } from "@/lib/data/tasks";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Cmd/Ctrl+K opens the command palette.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Collapse the sidebar to an icon rail on tablet widths, expand on desktop.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const apply = () => setCollapsed(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let active = true;
    countOverdueTasks()
      .then((n) => {
        if (active) setNotificationCount(n);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-sirius-navy">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
          notificationCount={notificationCount}
        />
        <OfflineBanner />
        <InstallPrompt />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
