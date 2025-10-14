"use client";

import { useEffect } from "react";
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
import { formatDuration } from "@/lib/mock-data";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const router = useRouter();
  const { state, playback, play, pause, stop, forward10, backward10 } =
    useAudioPlayer(audioUrl);

  useEffect(() => {
    if (state === "idle") {
      play();
    }
  }, [state, play]);

  const progress =
    playback.duration > 0
      ? (playback.currentTime / playback.duration) * 100
      : 0;

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
            Playback Error
          </h2>
          <p className="text-muted-foreground mb-6">
            Could not load the audio file. Please try again.
          </p>
          <Button onClick={() => router.push("/")} className="w-full">
            <ScanLine className="mr-2 h-5 w-5" />
            Scan Another Card
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
            <h2 className="text-2xl font-bold">Playing Song</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Listen and guess the song!
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
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
            Stop
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full h-12"
            size="lg"
          >
            <ScanLine className="mr-2 h-5 w-5" />
            Scan Another Card
          </Button>
        </div>
      </Card>
    </div>
  );
}
