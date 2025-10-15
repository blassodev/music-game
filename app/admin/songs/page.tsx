"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Play, Edit, Trash2 } from "lucide-react";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SongQRCode } from "@/components/song-qr-code";
import { AudioPlayerModal } from "@/components/audio-player-modal";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function SongsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<SongsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songsList = await pb
          .collection("songs")
          .getFullList<SongsRecord>();
        setSongs(songsList);
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, []);

  if (loading) {
    return <div>Cargando canciones...</div>;
  }

  const filteredSongs = songs.filter(
    (song) =>
      song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Songs Library</h2>
          <p className="text-sm text-muted-foreground">
            Manage your music collection
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, artist, or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No songs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Album</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSongs.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">
                        {song.title}
                      </TableCell>
                      <TableCell>{song.artist}</TableCell>
                      <TableCell>{song.album}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{song.year}</Badge>
                      </TableCell>
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
                            <Edit className="h-4 w-4" />
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

      <div className="text-sm text-muted-foreground">
        Showing {filteredSongs.length} of {songs.length} songs
      </div>
    </div>
  );
}
