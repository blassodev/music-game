"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SongQRCode } from "@/components/song-qr-code";
import { AudioPlayerModal } from "@/components/audio-player-modal";
import { AddCardToDeck } from "@/components/admin/add-card-to-deck";
import { GeneratePDFButton } from "@/components/admin/generate-pdf-button";
import { EditCard } from "@/components/admin/edit-card";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Trash2, ArrowUp, ArrowDown, Play } from "lucide-react";
import Link from "next/link";
import { DecksRecord, CardsRecord, SongsRecord } from "@/lib/types/pocketbase";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";

type CardWithDetails = CardsRecord & {
  songData?: SongsRecord;
};

interface DeckDetailClientProps {
  deck: DecksRecord;
  initialCards: CardWithDetails[];
}

export function DeckDetailClient({
  deck,
  initialCards,
}: DeckDetailClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState<CardWithDetails[]>(initialCards);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const updatedDeck = await pb.collection("decks").getOne(deck.id);

      if (!updatedDeck.cards || updatedDeck.cards.length === 0) {
        setCards([]);
        return;
      }

      // Obtener todas las cards con sus datos de canción
      const cardsWithDetails = await Promise.all(
        updatedDeck.cards.map(async (cardId: string) => {
          const card = await pb.collection("cards").getOne<CardsRecord>(cardId);

          // Si la card tiene una canción, obtenerla
          if (card.song) {
            const songData = await pb
              .collection("songs")
              .getOne<SongsRecord>(card.song);
            return { ...card, songData };
          }

          return card;
        })
      );

      setCards(cardsWithDetails);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardAdded = () => {
    fetchCards();
    router.refresh();
  };

  const handleCardUpdated = () => {
    fetchCards();
    router.refresh();
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;

    setIsDeleting(true);
    try {
      // Obtener el deck actualizado
      const currentDeck = await pb.collection("decks").getOne(deck.id);

      // Filtrar la card a eliminar del array de cards
      const updatedCards = (currentDeck.cards || []).filter(
        (cardId: string) => cardId !== cardToDelete
      );

      // Actualizar el deck con el nuevo array de cards
      await pb.collection("decks").update(deck.id, {
        cards: updatedCards,
      });

      // Opcionalmente, también puedes eliminar la card de la colección cards
      // await pb.collection("cards").delete(cardToDelete);

      fetchCards();
      router.refresh();
      setCardToDelete(null);
    } catch (error) {
      console.error("Error deleting card:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (cardId: string) => {
    setCardToDelete(cardId);
    setDeleteDialogOpen(true);
  };

  const moveCard = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= cards.length) return;

    try {
      const newCards = [...cards];
      [newCards[index], newCards[newIndex]] = [
        newCards[newIndex],
        newCards[index],
      ];

      // Actualizar el orden en el servidor
      const cardIds = newCards.map((card) => card.id);
      await pb.collection("decks").update(deck.id, {
        cards: cardIds,
      });

      setCards(newCards);
      router.refresh();
    } catch (error) {
      console.error("Error moving card:", error);
    }
  };

  const getCardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      song: "Canción",
      ost: "OST",
      opening: "Opening",
      ad: "Anuncio",
    };
    return labels[type] || type;
  };

  const getCardTitle = (card: CardWithDetails) => {
    switch (card.type) {
      case "song":
        return card.songData?.title || "Sin título";
      case "ost":
        return card.ost || "OST sin título";
      case "opening":
        return card.opening || "Opening sin título";
      case "ad":
        return card.ad || "Anuncio sin título";
      default:
        return "Sin título";
    }
  };

  const getCardArtist = (card: CardWithDetails) => {
    if (card.type === "song" && card.songData) {
      return card.songData.artist || "N/A";
    }
    return "N/A";
  };

  const getCardYear = (card: CardWithDetails) => {
    if (card.type === "song" && card.songData) {
      return card.songData.year?.toString() || "N/A";
    }
    return card.year || "N/A";
  };

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
            <GeneratePDFButton cards={cards} deckName={deck.name} />
            <AddCardToDeck deckId={deck.id} onCardAdded={handleCardAdded} />
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
          {cards.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No cards in this deck yet. Add some cards to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Card Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card, index) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCardTypeLabel(card.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {card.id}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getCardTitle(card)}
                      </TableCell>
                      <TableCell>{getCardArtist(card)}</TableCell>
                      <TableCell>{getCardYear(card)}</TableCell>
                      <TableCell>
                        {card.song && (
                          <SongQRCode
                            songId={card.song}
                            songTitle={getCardTitle(card)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {card.type === "song" && card.songData && (
                            <AudioPlayerModal
                              song={card.songData}
                              trigger={
                                <Button size="sm" variant="ghost">
                                  <Play className="h-4 w-4" />
                                </Button>
                              }
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveCard(index, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => moveCard(index, "down")}
                            disabled={index === cards.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <EditCard
                            card={card}
                            onCardUpdated={handleCardUpdated}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(card.id)}
                          >
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCard}
        title="Delete Card from Deck"
        description="Are you sure you want to remove this card from the deck? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
