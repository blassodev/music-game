import { LoginForm } from "@/components/admin/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getTranslations } from "next-intl/server";

export default async function AdminLoginPage() {
  const t = await getTranslations("admin.login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mt-2">{t("pageSubtitle")}</p>
        </div>

        <LoginForm />

        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
