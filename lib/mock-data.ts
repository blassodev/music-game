import { SongsRecord, DecksRecord } from "./types/pocketbase";import { Song, Deck } from "./types";



// Datos de ejemplo (para desarrollo y testing)// Datos de ejemplo (para desarrollo y testing)

export const mockSongs: SongsRecord[] = [import { Song, Deck, Collections } from "./types";

  {

    id: "1",// Datos de ejemplo (para desarrollo y testing)

    collectionId: "songs",export const mockSongs: Song[] = [

    collectionName: "songs",  {

    created: "2023-01-01T00:00:00.000Z",    id: "1",

    updated: "2023-01-01T00:00:00.000Z",    collectionId: "songs",

    title: "Bohemian Rhapsody",    collectionName: Collections.Songs,

    artist: "Queen",    title: "Bohemian Rhapsody",

    file: "",    artist: "Queen",

    image_cover: "",    album: "A Night at the Opera",

    duration: 355,    year: 1975,

    genre: "Rock",    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",

  },    createdAt: new Date().toISOString(),

  {    updatedAt: new Date().toISOString(),

    id: "2",  },

    collectionId: "songs",  {

    collectionName: "songs",    id: "2",

    created: "2023-01-01T00:00:00.000Z",    collectionId: "songs",

    updated: "2023-01-01T00:00:00.000Z",    collectionName: Collections.Songs,

    title: "Hotel California",    title: "Stairway to Heaven",

    artist: "Eagles",    artist: "Led Zeppelin",

    file: "",    album: "Led Zeppelin IV",

    image_cover: "",    year: 1971,

    duration: 391,    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",

    genre: "Rock",    createdAt: new Date().toISOString(),

  },    updatedAt: new Date().toISOString(),

  {  },

    id: "3",  {

    collectionId: "songs",    id: "3",

    collectionName: "songs",    collectionId: "songs",

    created: "2023-01-01T00:00:00.000Z",    collectionName: Collections.Songs,

    updated: "2023-01-01T00:00:00.000Z",    title: "Hotel California",

    title: "Imagine",    artist: "Eagles",

    artist: "John Lennon",    album: "Hotel California",

    file: "",    year: 1977,

    image_cover: "",    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",

    duration: 183,    createdAt: new Date().toISOString(),

    genre: "Pop",    updatedAt: new Date().toISOString(),

  },  },

];  {

    id: "4",

export const mockDecks: DecksRecord[] = [    collectionId: "songs",

  {    collectionName: Collections.Songs,

    id: "deck1",    title: "Imagine",

    collectionId: "decks",    artist: "John Lennon",

    collectionName: "decks",    album: "Imagine",

    created: "2023-01-01T00:00:00.000Z",    year: 1971,

    updated: "2023-01-01T00:00:00.000Z",    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",

    name: "Rock Classics",    createdAt: new Date().toISOString(),

    description: "Las mejores canciones de rock de todos los tiempos",    updatedAt: new Date().toISOString(),

    songs: ["1", "2"], // Relación múltiple con canciones  },

  },  {

  {    id: "5",

    id: "deck2",    collectionId: "songs",

    collectionId: "decks",    collectionName: Collections.Songs,

    collectionName: "decks",    title: "Sweet Child O' Mine",

    created: "2023-01-01T00:00:00.000Z",    artist: "Guns N' Roses",

    updated: "2023-01-01T00:00:00.000Z",    album: "Appetite for Destruction",

    name: "Pop Hits",    year: 1987,

    description: "Los éxitos pop más populares",    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",

    songs: ["3"], // Relación múltiple con canciones    createdAt: new Date().toISOString(),

  },    updatedAt: new Date().toISOString(),

];  },

  {

// Funciones auxiliares para obtener datos    id: "6",

export function getAllSongs(): SongsRecord[] {    collectionId: "songs",

  return mockSongs;    collectionName: Collections.Songs,

}    title: "Smells Like Teen Spirit",

    artist: "Nirvana",

export function getAllDecks(): DecksRecord[] {    album: "Nevermind",

  return mockDecks;    year: 1991,

}    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",

    createdAt: new Date().toISOString(),

export function getSongById(id: string): SongsRecord | undefined {    updatedAt: new Date().toISOString(),

  return mockSongs.find((song) => song.id === id);  },

}  {

    id: "7",

export function getDeckById(id: string): DecksRecord | undefined {    collectionId: "songs",

  return mockDecks.find((deck) => deck.id === id);    collectionName: Collections.Songs,

}    title: "Billie Jean",

    artist: "Michael Jackson",

export function getSongsByDeckId(deckId: string): SongsRecord[] {    album: "Thriller",

  const deck = getDeckById(deckId);    year: 1982,

  if (!deck || !deck.songs) return [];    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",

      createdAt: new Date().toISOString(),

  return mockSongs.filter((song) => deck.songs!.includes(song.id));    updatedAt: new Date().toISOString(),

}  },

  {

// Función para generar código QR único (simulado)    id: "8",

export function generateCardCode(): string {    collectionId: "songs",

  return Math.random().toString(36).substring(2, 15);    collectionName: Collections.Songs,

}    title: "Purple Rain",
    artist: "Prince",
    album: "Purple Rain",
    year: 1984,
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    collectionId: "songs",
    collectionName: Collections.Songs,
    title: "Wonderwall",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    year: 1995,
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    collectionId: "songs",
    collectionName: Collections.Songs,
    title: "Hey Jude",
    artist: "The Beatles",
    album: "Hey Jude",
    year: 1968,
    audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockDecks: Deck[] = [
  {
    id: "deck-1",
    collectionId: "decks",
    collectionName: Collections.Decks,
    name: "Rock Classics",
    description: "The greatest rock songs of all time",
    isActive: true,
    songs: ["1", "2", "3", "5"], // IDs de las canciones asociadas
    created: "2024-01-15T10:00:00Z",
    updated: "2024-01-15T10:00:00Z",
  },
  {
    id: "deck-2",
    collectionId: "decks",
    collectionName: Collections.Decks,
    name: "80s Hits",
    description: "Memorable hits from the 1980s",
    isActive: true,
    songs: ["7", "8"], // IDs de las canciones asociadas
    created: "2024-02-20T14:30:00Z",
    updated: "2024-02-20T14:30:00Z",
  },
  {
    id: "deck-3",
    collectionId: "decks",
    collectionName: Collections.Decks,
    name: "Soul & Funk",
    description: "Soul and funk music legends",
    isActive: true,
    songs: ["4", "10"], // IDs de las canciones asociadas
    created: "2024-03-10T09:15:00Z",
    updated: "2024-03-10T09:15:00Z",
  },
];

// Funciones helper para trabajar con los datos mock
export function getAllSongs(): Song[] {
  return mockSongs;
}

export function getSongById(id: string): Song | null {
  return mockSongs.find((s) => s.id === id) || null;
}

export function getAllDecks(): Deck[] {
  return mockDecks;
}

export function getDeckById(id: string): Deck | null {
  return mockDecks.find((d) => d.id === id) || null;
}

export function getSongsByDeckId(deckId: string): Song[] {
  const deck = getDeckById(deckId);
  if (!deck || !deck.songs) return [];
  
  return deck.songs
    .map(songId => getSongById(songId))
    .filter((song): song is Song => song !== null);
}

// Función para simular la búsqueda por código QR (usando el ID de la canción como código)
export function getSongByQRCode(qrCode: string): Song | null {
  return getSongById(qrCode);
}

export const mockDecks: Deck[] = [
  {
    id: "deck-1",
    name: "Rock Classics",
    description: "The greatest rock songs of all time",
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "deck-2",
    name: "80s Hits",
    description: "Memorable hits from the 1980s",
    isActive: true,
    createdAt: "2024-02-20T14:30:00Z",
  },
  {
    id: "deck-3",
    name: "Soul & Funk",
    description: "Soul and funk music legends",
    isActive: true,
    createdAt: "2024-03-10T09:15:00Z",
  },
];

export const mockDeckCards: DeckCard[] = [
  { id: "card-1", deckId: "deck-1", songId: "1", cardCode: "CARD-ROCK-001-A1B2", position: 1 },
  { id: "card-2", deckId: "deck-1", songId: "2", cardCode: "CARD-ROCK-002-C3D4", position: 2 },
  { id: "card-3", deckId: "deck-1", songId: "3", cardCode: "CARD-ROCK-003-E5F6", position: 3 },
  { id: "card-4", deckId: "deck-1", songId: "5", cardCode: "CARD-ROCK-004-G7H8", position: 4 },
  { id: "card-5", deckId: "deck-1", songId: "11", cardCode: "CARD-ROCK-005-I9J0", position: 5 },
  { id: "card-6", deckId: "deck-1", songId: "16", cardCode: "CARD-ROCK-006-K1L2", position: 6 },
  { id: "card-7", deckId: "deck-1", songId: "17", cardCode: "CARD-ROCK-007-M3N4", position: 7 },

  { id: "card-8", deckId: "deck-2", songId: "7", cardCode: "CARD-80S-001-O5P6", position: 1 },
  { id: "card-9", deckId: "deck-2", songId: "8", cardCode: "CARD-80S-002-Q7R8", position: 2 },
  { id: "card-10", deckId: "deck-2", songId: "20", cardCode: "CARD-80S-003-S9T0", position: 3 },

  { id: "card-11", deckId: "deck-3", songId: "13", cardCode: "CARD-SOUL-001-U1V2", position: 1 },
  { id: "card-12", deckId: "deck-3", songId: "19", cardCode: "CARD-SOUL-002-W3X4", position: 2 },
];

export function getSongByCardCode(cardCode: string): Song | null {
  const card = mockDeckCards.find((c) => c.cardCode === cardCode);
  if (!card) return null;
  return mockSongs.find((s) => s.id === card.songId) || null;
}

export function getAllSongs(): Song[] {
  return mockSongs;
}

export function getSongById(id: string): Song | null {
  return mockSongs.find((s) => s.id === id) || null;
}

export function getAllDecks(): Deck[] {
  return mockDecks;
}

export function getDeckById(id: string): Deck | null {
  return mockDecks.find((d) => d.id === id) || null;
}

export function getCardsByDeckId(deckId: string): DeckCard[] {
  return mockDeckCards.filter((c) => c.deckId === deckId);
}

export function generateCardCode(deckName: string): string {
  const prefix = deckName.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `CARD-${prefix}-${timestamp}-${random}`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function validateCardCode(code: string): boolean {
  return /^CARD-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/.test(code);
}
