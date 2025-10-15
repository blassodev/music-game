"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Search, Plus, Play, Edit, Trash2, Download } from "lucide-react";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SongQRCode } from "@/components/song-qr-code";
import { AudioPlayerModal } from "@/components/audio-player-modal";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { toast } from "sonner";

export default function SongsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<SongsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    song: SongsRecord | null;
  }>({ open: false, song: null });
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (song: SongsRecord) => {
    setDeleteDialog({ open: true, song });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.song) return;

    setIsDeleting(true);
    try {
      await pb.collection("songs").delete(deleteDialog.song.id);
      setSongs((prev) => prev.filter((s) => s.id !== deleteDialog.song!.id));
      toast.success("Canción eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting song:", error);
      toast.error("Error al eliminar la canción");
    } finally {
      setIsDeleting(false);
      setDeleteDialog({ open: false, song: null });
    }
  };

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
        <div className="flex gap-2">
          <Link href="/admin/songs/import">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Import from URL
            </Button>
          </Link>
          <Link href="/admin/songs/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Song
            </Button>
          </Link>
        </div>
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
                          <Link href={`/admin/songs/${song.id}/edit`}>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClick(song)}
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

      <div className="text-sm text-muted-foreground">
        Showing {filteredSongs.length} of {songs.length} songs
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, song: deleteDialog.song })
        }
        onConfirm={handleDeleteConfirm}
        title="Eliminar Canción"
        description={`¿Estás seguro de que quieres eliminar "${deleteDialog.song?.title}"? Esta acción no se puede deshacer.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
