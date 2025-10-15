import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Library, Layers } from "lucide-react";
import pb from "@/lib/pocketbase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SongsRecord, DecksRecord } from "@/lib/types/pocketbase";

async function getStats() {
  try {
    const [songs, decks] = await Promise.all([
      pb.collection("songs").getFullList<SongsRecord>(),
      pb.collection("decks").getFullList<DecksRecord>(),
    ]);

    // Calcular total de cartas basado en las canciones en los decks
    const totalCards = decks.reduce((total, deck) => {
      return total + (deck.songs?.length || 0);
    }, 0);

    return {
      totalSongs: songs.length,
      totalDecks: decks.length,
      totalCards,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalSongs: 0,
      totalDecks: 0,
      totalCards: 0,
    };
  }
}

export default async function AdminDashboard() {
  const { totalSongs, totalDecks, totalCards } = await getStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Songs</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSongs}</div>
            <p className="text-xs text-muted-foreground">
              Songs in your library
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDecks}</div>
            <p className="text-xs text-muted-foreground">
              Active and inactive decks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCards}</div>
            <p className="text-xs text-muted-foreground">
              Cards across all decks
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/songs">
              <Button variant="outline" className="w-full justify-start">
                <Music className="mr-2 h-4 w-4" />
                Manage Songs
              </Button>
            </Link>
            <Link href="/admin/decks">
              <Button variant="outline" className="w-full justify-start">
                <Library className="mr-2 h-4 w-4" />
                Manage Decks
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display. Start by managing your songs or
              decks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
