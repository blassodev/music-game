import { Song, Deck, DeckCard } from "./types";

export const mockSongs: Song[] = [
  {
    id: "1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night at the Opera",
    duration: 354,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    album: "Led Zeppelin IV",
    duration: 482,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    title: "Hotel California",
    artist: "Eagles",
    album: "Hotel California",
    duration: 391,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "4",
    title: "Imagine",
    artist: "John Lennon",
    album: "Imagine",
    duration: 183,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "5",
    title: "Sweet Child O' Mine",
    artist: "Guns N' Roses",
    album: "Appetite for Destruction",
    duration: 356,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "6",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    album: "Nevermind",
    duration: 301,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    id: "7",
    title: "Billie Jean",
    artist: "Michael Jackson",
    album: "Thriller",
    duration: 294,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    id: "8",
    title: "Purple Rain",
    artist: "Prince",
    album: "Purple Rain",
    duration: 508,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "9",
    title: "Wonderwall",
    artist: "Oasis",
    album: "(What's the Story) Morning Glory?",
    duration: 258,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "10",
    title: "Hey Jude",
    artist: "The Beatles",
    album: "Hey Jude",
    duration: 431,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "11",
    title: "Back in Black",
    artist: "AC/DC",
    album: "Back in Black",
    duration: 255,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "12",
    title: "Like a Rolling Stone",
    artist: "Bob Dylan",
    album: "Highway 61 Revisited",
    duration: 370,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "13",
    title: "What's Going On",
    artist: "Marvin Gaye",
    album: "What's Going On",
    duration: 232,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "14",
    title: "Good Vibrations",
    artist: "The Beach Boys",
    album: "Smiley Smile",
    duration: 216,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    id: "15",
    title: "Johnny B. Goode",
    artist: "Chuck Berry",
    album: "Chuck Berry Is on Top",
    duration: 161,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    id: "16",
    title: "Born to Run",
    artist: "Bruce Springsteen",
    album: "Born to Run",
    duration: 270,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "17",
    title: "Whole Lotta Love",
    artist: "Led Zeppelin",
    album: "Led Zeppelin II",
    duration: 334,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "18",
    title: "Light My Fire",
    artist: "The Doors",
    album: "The Doors",
    duration: 427,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "19",
    title: "Respect",
    artist: "Aretha Franklin",
    album: "I Never Loved a Man the Way I Love You",
    duration: 147,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "20",
    title: "One",
    artist: "U2",
    album: "Achtung Baby",
    duration: 276,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
];

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
