import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
    // The web manifest and app icons are provided by the file conventions
    // app/manifest.ts, app/icon.svg and app/apple-icon.png, which Next.js
    // links into <head> automatically.
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("appTitle"),
    },
  };
}
