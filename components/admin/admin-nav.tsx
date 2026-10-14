"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, Library, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations("admin.navigation");

  const links = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/songs", label: t("songs"), icon: Music },
    { href: "/admin/decks", label: t("decks"), icon: Library },
  ];

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
