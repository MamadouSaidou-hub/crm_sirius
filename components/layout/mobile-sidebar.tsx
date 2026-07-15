"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { UserCard } from "@/components/layout/user-card";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Drawer navigation for screens below md. */
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center border-b border-border px-4">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <NavLinks onNavigate={() => onOpenChange(false)} />
        </div>
        <div className="space-y-3 border-t border-border p-3">
          <UserCard />
        </div>
      </SheetContent>
    </Sheet>
  );
}
