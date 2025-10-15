"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Music } from "lucide-react";
import pb from "@/lib/pocketbase";
import { DecksRecord, SongsRecord } from "@/lib/types/pocketbase";
import { toast } from "sonner";

interface DeckFormProps {
  deck?: DecksRecord;
  isEdit?: boolean;
}

export function DeckForm({ deck, isEdit = false }: DeckFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.decks.form");
  const tCommon = useTranslations("common");

  const [formData, setFormData] = useState({
    name: deck?.name || "",
    description: deck?.description || "",
    isActive: deck?.isActive ?? true,
  });

  const [selectedSongs, setSelectedSongs] = useState<string[]>(
    deck?.songs || []
  );
  const [availableSongs, setAvailableSongs] = useState<SongsRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songs = await pb.collection("songs").getFullList<SongsRecord>();
        setAvailableSongs(songs);
      } catch (error) {
        console.error("Error fetching songs:", error);
        toast.error("Error al cargar las canciones");
      } finally {
        setLoadingSongs(false);
      }
    };

    fetchSongs();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSongToggle = (songId: string) => {
    setSelectedSongs((prev) => {
      if (prev.includes(songId)) {
        return prev.filter((id) => id !== songId);
      } else {
        return [...prev, songId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre del mazo es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        songs: selectedSongs,
      };

      if (isEdit && deck) {
        // Actualizar mazo existente
        await pb.collection("decks").update(deck.id, data);
        toast.success("Mazo actualizado exitosamente");
      } else {
        // Crear nuevo mazo
        await pb.collection("decks").create(data);
        toast.success("Mazo creado exitosamente");
      }

      router.push("/admin/decks");
      router.refresh();
    } catch (error) {
      console.error("Error saving deck:", error);
      toast.error("Error al guardar el mazo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Mazo" : "Crear Nuevo Mazo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("description", e.target.value)
              }
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive">{t("isActive")}</Label>
            </div>
            <p className="text-sm text-muted-foreground">{t("isActiveHelp")}</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>{t("songs")}</Label>
              <p className="text-sm text-muted-foreground">{t("songsHelp")}</p>
            </div>

            {loadingSongs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">{tCommon("loading")}</span>
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  {availableSongs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No hay canciones disponibles
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {availableSongs.map((song) => (
                        <div
                          key={song.id}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <Checkbox
                            id={`song-${song.id}`}
                            checked={selectedSongs.includes(song.id)}
                            onCheckedChange={() => handleSongToggle(song.id)}
                          />
                          <Music className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`song-${song.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {song.title}
                            </Label>
                            <p className="text-xs text-muted-foreground truncate">
                              {song.artist && song.album
                                ? `${song.artist} • ${song.album}`
                                : song.artist || song.album || "Sin artista"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSongs.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {selectedSongs.length} canción
                        {selectedSongs.length !== 1 ? "es" : ""} seleccionada
                        {selectedSongs.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || loadingSongs}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("../common.loading")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
