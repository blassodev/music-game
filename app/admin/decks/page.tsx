"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Library, Edit, Trash2 } from "lucide-react";
import pb from "@/lib/pocketbase";
import { DecksRecord } from "@/lib/types/pocketbase";

export default function DecksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [decks, setDecks] = useState<DecksRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div>Cargando decks...</div>;
  }

  const filteredDecks = decks.filter(
    (deck) =>
      deck.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Decks Management</h2>
          <p className="text-sm text-muted-foreground">
            Organize songs into themed decks
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Deck
        </Button>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDecks.map((deck) => {
            const cardCount = deck.songs?.length || 0;
            return (
              <Card key={deck.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between">
                    <Library className="h-8 w-8 text-primary" />
                    <Badge variant="default">{cardCount} songs</Badge>
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
                    <Link href={`/admin/decks/${deck.id}`} className="flex-1">
                      <Button variant="default" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {filteredDecks.length} of {decks.length} decks
      </div>
    </div>
  );
}
