// Re-export PocketBase types
export * from "./pocketbase";

// Import the PocketBase types we'll extend or alias
import {
  SongsRecord,
  SongsResponse,
  DecksRecord,
  DecksResponse,
} from "./pocketbase";

// Alias PocketBase types for easier usage
export type Song = SongsResponse;
export type SongRecord = SongsRecord;
export type Deck = DecksResponse;
export type DeckRecord = DecksRecord;

// Additional UI types
export type PlayerState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "stopped"
  | "error";

export interface PlaybackStatus {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}
