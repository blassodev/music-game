"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Library, Edit, Trash2 } from "lucide-react";
import pb from "@/lib/pocketbase";
import { DecksRecord } from "@/lib/types/pocketbase";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function DecksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [decks, setDecks] = useState<DecksRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    deck: DecksRecord | null;
  }>({ open: false, deck: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const decksList = await pb
          .collection("decks")
          .getFullList<DecksRecord>();
        setDecks(decksList);
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  const filteredDecks = decks.filter(
    (deck) =>
      deck.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(filteredDecks.length / 3), // número de filas (3 columnas por fila)
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250, // altura estimada de cada fila de cards
    overscan: 2,
  });

  const handleDeleteClick = (deck: DecksRecord) => {
    setDeleteDialog({ open: true, deck });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.deck) return;

    setIsDeleting(true);
    try {
      await pb.collection("decks").delete(deleteDialog.deck.id);
      setDecks((prev) => prev.filter((d) => d.id !== deleteDialog.deck!.id));
      toast.success("Mazo eliminado exitosamente");
    } catch (error) {
      console.error("Error deleting deck:", error);
      toast.error("Error al eliminar el mazo");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, deck: null });
    }
  };

  if (loading) {
    return <div>Cargando decks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Decks Management</h2>
          <p className="text-sm text-muted-foreground">
            Organize songs into themed decks
          </p>
        </div>
        <Link href="/admin/decks/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Deck
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search decks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredDecks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No decks found</p>
          </CardContent>
        </Card>
      ) : (
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: "600px" }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * 3;
              const rowDecks = filteredDecks.slice(startIndex, startIndex + 3);

              return (
                <div
                  key={virtualRow.index}
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 px-1"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {rowDecks.map((deck) => {
                    const cardCount = deck.cards?.length || 0;
                    return (
                      <Card key={deck.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50">
                          <div className="flex items-start justify-between">
                            <Library className="h-8 w-8 text-primary" />
                            <Badge variant="default">{cardCount} cards</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <CardTitle className="mb-2">{deck.name}</CardTitle>
                          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                            {deck.description}
                          </p>
                          <div className="mb-4 flex items-center gap-2 text-sm">
                            <Badge variant="outline">{cardCount} cards</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/decks/${deck.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="default"
                                className="w-full"
                                size="sm"
                              >
                                View Details
                              </Button>
                            </Link>
                            <Link href={`/admin/decks/${deck.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(deck)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {filteredDecks.length} of {decks.length} decks
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, deck: deleteDialog.deck })
        }
        onConfirm={handleDeleteConfirm}
        title="Eliminar Mazo"
        description={`¿Estás seguro de que quieres eliminar el mazo "${deleteDialog.deck?.name}"? Esta acción no se puede deshacer.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
