"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  ScanLine,
} from "lucide-react";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import { useTranslations } from "next-intl";
import { SongsRecord } from "@/lib/types/pocketbase";
import pb from "@/lib/pocketbase";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  song: SongsRecord;
}

export function AudioPlayer({ song }: AudioPlayerProps) {
  const router = useRouter();
  const t = useTranslations("player");

  // Generar la URL del audio del lado del cliente
  const audioUrl = useMemo(() => {
    if (!song.audio) {
      console.warn("No audio file available for song:", song.id);
      return "";
    }

    const url = pb.files.getURL(song, song.audio);
    return url;
  }, [song]);

  const { state, playback, play, pause, stop, forward10, backward10, seek } =
    useAudioPlayer(audioUrl);

  useEffect(() => {
    if (state === "idle") {
      play();
    }
  }, [state, play]);

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    seek(newTime);
  };

  const progress =
    playback.duration > 0
      ? (playback.currentTime / playback.duration) * 100
      : 0;

  // Si no hay URL de audio válida, mostrar error inmediatamente
  if (!audioUrl) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">
            No hay archivo de audio
          </h2>
          <p className="text-muted-foreground mb-4">
            Esta canción no tiene un archivo de audio asociado.
          </p>

          {/* Debug info */}
          <div className="mb-6 p-3 bg-muted rounded text-left text-xs space-y-1">
            <div>
              <strong>Song ID:</strong> {song.id}
            </div>
            <div>
              <strong>Audio file:</strong> {song.audio || "No audio file"}
            </div>
          </div>

          <Button onClick={() => router.push("/")} className="w-full">
            <ScanLine className="mr-2 h-5 w-5" />
            {t("buttons.scanAnother")}
          </Button>
        </Card>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="space-y-4">
            <Skeleton className="mx-auto h-24 w-24 rounded-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-2 justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-destructive mb-4">
            {t("error.title")}
          </h2>
          <p className="text-muted-foreground mb-4">{t("error.message")}</p>

          {/* Debug info */}
          <div className="mb-6 p-3 bg-muted rounded text-left text-xs space-y-1">
            <div>
              <strong>Song ID:</strong> {song.id}
            </div>
            <div>
              <strong>Audio file:</strong> {song.audio || "No audio file"}
            </div>
            <div>
              <strong>Generated URL:</strong> {audioUrl || "No URL generated"}
            </div>
            {audioUrl && (
              <div className="mt-2">
                <strong>Test URL:</strong>{" "}
                <a
                  href={audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Click to test
                </a>
              </div>
            )}
          </div>

          <Button onClick={() => router.push("/")} className="w-full">
            <ScanLine className="mr-2 h-5 w-5" />
            {t("buttons.scanAnother")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="space-y-6 p-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/20">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 bg-primary rounded-full transition-all duration-300 ${
                      playback.isPlaying ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: playback.isPlaying
                        ? `${30 + Math.random() * 30}px`
                        : "20px",
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
            <h2 className="text-2xl font-bold">{t("title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <input
                type="range"
                min={0}
                max={playback.duration}
                value={playback.currentTime}
                onChange={(e) => handleSeek([Number(e.target.value)])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={!playback.duration}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDuration(Math.floor(playback.currentTime))}</span>
              <span>{formatDuration(Math.floor(playback.duration))}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={backward10}
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            {playback.isPlaying ? (
              <Button
                onClick={pause}
                size="lg"
                className="h-20 w-20 rounded-full"
              >
                <Pause className="h-8 w-8" />
              </Button>
            ) : (
              <Button
                onClick={play}
                size="lg"
                className="h-20 w-20 rounded-full"
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            )}

            <Button
              onClick={forward10}
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          <Button
            onClick={stop}
            variant="destructive"
            className="w-full h-12"
            size="lg"
          >
            <Square className="mr-2 h-5 w-5" />
            {t("buttons.stop")}
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full h-12"
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
