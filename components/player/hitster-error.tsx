"use client";

import { AlertTriangle, RefreshCw, ScanLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { HitsterErrorCode } from "@/lib/hitster/errors";

interface HitsterErrorCardProps {
  code: HitsterErrorCode;
  sku?: string;
  card?: string;
}

export function HitsterErrorCard({ code, sku, card }: HitsterErrorCardProps) {
  const router = useRouter();
  const t = useTranslations("hitster");

  let message: string;
  switch (code) {
    case "invalid_code":
      message = t("error.invalid_code");
      break;
    case "card_not_found":
      message = t("error.card_not_found");
      break;
    case "no_match":
      message = t("error.no_match");
      break;
    case "spotify_unavailable":
      message = t("error.spotify_unavailable");
      break;
    case "download_failed":
      message = t("error.download_failed");
      break;
    default:
      message = t("error.generic");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">{t("error.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {sku && card && (
          <div className="mt-4 rounded bg-muted p-2 text-left text-xs text-muted-foreground">
            <span className="font-mono">
              {sku} / {card}
            </span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <Button
            className="w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            {t("buttons.retry")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            <ScanLine className="mr-2 h-5 w-5" />
            {t("buttons.scanAnother")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
