import { UrlImportForm } from "@/components/admin/url-import-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ImportSongPage() {
  const t = await getTranslations("admin.songs.import");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/songs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{t("pageTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>

      <UrlImportForm />
    </div>
  );
}
