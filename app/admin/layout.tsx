import { AdminNav } from "@/components/admin/admin-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("admin.layout");

  return (
    <div className="min-h-screen">
      <div className="border-b bg-background py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
      <AdminNav />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
