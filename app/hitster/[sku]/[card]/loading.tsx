import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";

export default async function HitsterLoading() {
  const t = await getTranslations("hitster");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        <h2 className="text-lg font-semibold">{t("resolving")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("downloadHint")}</p>
      </Card>
    </div>
  );
}
