import { notFound } from "next/navigation";
import {
  getDeckById,
  getCardsByDeckId,
  getSongById,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ArrowLeft, QrCode, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
import { QRCodeDisplay } from "@/components/admin/qr-code-display";

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = getDeckById(id);

  if (!deck) {
    notFound();
  }

  const cards = getCardsByDeckId(id);
  const cardsWithSongs = cards
    .map((card) => {
      const song = getSongById(card.songId);
      return song ? { ...card, song } : null;
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

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
            <div className="text-2xl font-bold">{cards.length}</div>
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
              {new Date(deck.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deck Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {cardsWithSongs.length === 0 ? (
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
                  {cardsWithSongs.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">
                        {card.position}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {card.cardCode}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {card.song.title}
                      </TableCell>
                      <TableCell>{card.song.artist}</TableCell>
                      <TableCell>
                        <QRCodeDisplay cardCode={card.cardCode} size={40} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
