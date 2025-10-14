export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  audioUrl: string;
  coverUrl?: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface DeckCard {
  id: string;
  deckId: string;
  songId: string;
  cardCode: string;
  position: number;
}

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "stopped" | "error";

export interface PlaybackStatus {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}
