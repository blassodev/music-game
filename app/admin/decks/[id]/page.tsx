import { notFound } from "next/navigation";
import pb from "@/lib/pocketbase";
import { DecksRecord, SongsRecord } from "@/lib/types/pocketbase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SongQRCode } from "@/components/song-qr-code";
import { AudioPlayerModal } from "@/components/audio-player-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  ArrowLeft,
  QrCode,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
} from "lucide-react";
import Link from "next/link";

async function getDeckWithSongs(id: string) {
  try {
    const deck = await pb.collection("decks").getOne<DecksRecord>(id);
    let songs: SongsRecord[] = [];

    if (deck.songs && deck.songs.length > 0) {
      // Obtener todas las canciones del deck
      songs = await pb.collection("songs").getFullList<SongsRecord>({
        filter: deck.songs.map((songId) => `id='${songId}'`).join(" || "),
      });
    }

    return { deck, songs };
  } catch (error) {
    console.error("Error fetching deck:", error);
    return null;
  }
}

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDeckWithSongs(id);

  if (!result) {
    notFound();
  }

  const { deck, songs } = result;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/decks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Button>
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{deck.name}</h2>
              <Badge variant={deck.isActive ? "default" : "secondary"}>
                {deck.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{deck.description}</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{songs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deck.isActive ? "Active" : "Inactive"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {deck.created
                ? new Date(deck.created).toLocaleDateString()
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deck Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No cards in this deck yet. Add some songs to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Card Code</TableHead>
                    <TableHead>Song</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songs.map((song, index) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {song.id}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {song.title}
                      </TableCell>
                      <TableCell>{song.artist}</TableCell>
                      <TableCell>
                        <SongQRCode songId={song.id} songTitle={song.title} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AudioPlayerModal
                            song={song}
                            trigger={
                              <Button size="sm" variant="ghost">
                                <Play className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button size="sm" variant="ghost">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
