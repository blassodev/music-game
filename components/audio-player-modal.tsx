"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { SongsRecord } from "@/lib/types/pocketbase";
import { useAudioPlayer } from "@/lib/hooks/use-audio-player";
import pb from "@/lib/pocketbase";

interface AudioPlayerModalProps {
  song: SongsRecord;
  trigger: React.ReactNode;
}

export function AudioPlayerModal({ song, trigger }: AudioPlayerModalProps) {
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Función para obtener la URL completa del archivo de audio desde PocketBase
  const getAudioUrl = (song: SongsRecord): string => {
    if (!song.audio) {
      console.warn("No audio file available for song:", song.id);
      return "";
    }

    const audioUrl = pb.files.getURL(song, song.audio);
    return audioUrl;
  };

  // Usar el hook de audio player con la URL del audio
  const audioUrl = getAudioUrl(song);
  const { state, playback, play, pause, seek, forward10, backward10 } =
    useAudioPlayer(audioUrl);

  useEffect(() => {
    // Pausar cuando se cierre el modal
    if (!isOpen && state === "playing") {
      pause();
    }
  }, [isOpen, state, pause]);

  const togglePlay = () => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    seek(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    // El hook useAudioPlayer no maneja volumen, así que mantenemos esta funcionalidad local
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    // El hook useAudioPlayer no maneja volumen, así que mantenemos esta funcionalidad local
    if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">🎵 {song.title}</DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            {song.artist} {song.album && `• ${song.album}`}{" "}
            {song.year && `(${song.year})`}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="relative">
              <Progress
                value={(playback.currentTime / playback.duration) * 100}
                className="w-full"
              />
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
              <span>{formatTime(playback.currentTime)}</span>
              <span>{formatTime(playback.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              size="sm"
              variant="outline"
              onClick={backward10}
              disabled={!playback.duration}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              onClick={togglePlay}
              disabled={!song.audio || state === "error"}
              className="h-12 w-12 rounded-full"
            >
              {state === "loading" ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              ) : playback.isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={forward10}
              disabled={!playback.duration}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="p-1"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange([Number(e.target.value)])}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer hover:bg-gray-300 transition-colors"
            />
          </div>

          {/* Status messages */}
          {!song.audio && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                ⚠️ No hay archivo de audio disponible
              </p>
            </div>
          )}

          {state === "error" && song.audio && (
            <div className="text-center py-2">
              <p className="text-sm text-red-500">
                ❌ Error al cargar el audio
              </p>
            </div>
          )}

          {/* Song info */}
          <div className="text-center space-y-1">
            <code className="text-xs bg-muted px-2 py-1 rounded">
              ID: {song.id}
            </code>
            {/* Debug info - temporal */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Audio file: {song.audio || "No audio file"}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
