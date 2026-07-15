import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const ROLE_RING: Record<UserRole, string> = {
  admin: "bg-sirius-gold/20 text-sirius-gold",
  manager: "bg-sirius-teal/20 text-sirius-teal",
  commercial: "bg-secondary text-foreground",
};

interface UserAvatarProps {
  name: string;
  role?: UserRole;
  className?: string;
}

/** Initials avatar tinted by role. No image assets in the prototype. */
export function UserAvatar({ name, role, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn(role && ROLE_RING[role])}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
