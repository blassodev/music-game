"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PlayerState, PlaybackStatus } from "@/lib/types";

export function useAudioPlayer(audioUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>("idle");
  const [playback, setPlayback] = useState<PlaybackStatus>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  });

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    setState("loading");

    const handleLoadedMetadata = () => {
      setPlayback((prev) => ({ ...prev, duration: audio.duration }));
      setState("idle");
    };

    const handleTimeUpdate = () => {
      setPlayback((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handlePlay = () => {
      setState("playing");
      setPlayback((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState("paused");
      setPlayback((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState("stopped");
      setPlayback((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    const handleError = () => {
      setState("error");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.src = "";
    };
  }, [audioUrl]);

  const play = useCallback(async () => {
    try {
      await audioRef.current?.play();
    } catch {
      setState("error");
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState("stopped");
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const forward10 = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10,
        audioRef.current.duration
      );
    }
  }, []);

  const backward10 = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 10,
        0
      );
    }
  }, []);

  return {
    state,
    playback,
    play,
    pause,
    stop,
    seek,
    forward10,
    backward10,
  };
}
