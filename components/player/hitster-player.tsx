"use client";

import {
  Pause,
  Play,
  ScanLine,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { HitsterErrorCard } from "@/components/player/hitster-error";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { withBasePath } from "@/lib/base-path";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import type { ResolvedHitster } from "@/lib/hitster/types";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface HitsterPlayerProps {
  meta: ResolvedHitster;
}

export function HitsterPlayer({ meta }: HitsterPlayerProps) {
  const router = useRouter();
  const t = useTranslations("hitster");
  const [hadMetadata, setHadMetadata] = useState(false);

  const audioUrl = useMemo(
    () =>
      withBasePath(
        `/api/hitster/stream?sku=${encodeURIComponent(
          meta.sku
        )}&card=${encodeURIComponent(meta.card)}`
      ),
    [meta.sku, meta.card]
  );

  const { state, playback, play, pause, stop, forward10, backward10, seek } =
    useAudioPlayer(audioUrl);

  // Once the audio is ready we never go back to the "downloading" screen,
  // so a later playback error is shown as such (not as a re-download).
  useEffect(() => {
    if (playback.duration > 0) setHadMetadata(true);
  }, [playback.duration]);

  if (state === "error" && hadMetadata) {
    return <HitsterErrorCard code="download_failed" sku={meta.sku} card={meta.card} />;
  }

  // The stream endpoint downloads the track on first request, so "loading"
  // covers both the network wait and the on-the-fly Deezer download.
  if (!hadMetadata && (state === "loading" || state === "idle")) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <h2 className="text-lg font-semibold">{t("downloading")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("downloadHint")}
          </p>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return <HitsterErrorCard code="download_failed" sku={meta.sku} card={meta.card} />;
  }

  const progress =
    playback.duration > 0
      ? (playback.currentTime / playback.duration) * 100
      : 0;
  const cover = meta.coverBig || meta.cover;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="space-y-6 p-6 md:p-8">
          <div className="text-center">
            <div className="relative mx-auto mb-5 h-40 w-40 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg">
              {cover ? (
                <Image
                  src={cover}
                  alt=""
                  width={320}
                  height={320}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Play className="h-10 w-10 text-primary/50" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold leading-tight">{meta.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{meta.artist}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              {meta.year && meta.year !== "0" && <span>{meta.year}</span>}
              {meta.album && <span>· {meta.album}</span>}
              {meta.explicit && (
                <span className="rounded bg-muted px-1.5 py-0.5">Explicit</span>
              )}
            </div>
            {meta.gamesetName && (
              <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                {t("gameset")}: {meta.gamesetName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <input
                type="range"
                min={0}
                max={playback.duration}
                step={1}
                value={playback.currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                disabled={!playback.duration}
                aria-label={t("title")}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(playback.currentTime)}</span>
              <span>{formatDuration(playback.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={backward10}
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full"
              aria-label="-10s"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            {playback.isPlaying ? (
              <Button
                onClick={pause}
                size="lg"
                className="h-20 w-20 rounded-full"
                aria-label={t("buttons.pause")}
              >
                <Pause className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                onClick={play}
                size="lg"
                className="h-20 w-20 rounded-full"
                aria-label={t("buttons.play")}
              >
                <Play className="ml-1 h-8 w-8" />
              </Button>
            )}

            <Button
              onClick={forward10}
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full"
              aria-label="+10s"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          <Button onClick={stop} variant="destructive" className="h-12 w-full" size="lg">
            <Square className="mr-2 h-5 w-5" />
            {t("buttons.stop")}
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="h-12 w-full"
            size="lg"
          >
            <ScanLine className="mr-2 h-5 w-5" />
            {t("buttons.scanAnother")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
