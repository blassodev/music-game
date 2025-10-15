"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const isAdmin = pathname?.startsWith("/admin");
  const isHome = pathname === "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors",
            isHome
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs font-medium">{t("scanner")}</span>
        </Link>
        <Link
          href="/admin"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-6 py-2 transition-colors",
            isAdmin
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs font-medium">{t("admin")}</span>
        </Link>
      </div>
    </nav>
  );
}
