"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Wand2 } from "lucide-react";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { toast } from "sonner";
import { parseBlob } from "music-metadata-browser";

interface SongFormProps {
  song?: SongsRecord;
  isEdit?: boolean;
}

export function SongForm({ song, isEdit = false }: SongFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.songs.form");

  const [formData, setFormData] = useState({
    title: song?.title || "",
    artist: song?.artist || "",
    album: song?.album || "",
    year: song?.year?.toString() || "",
  });

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);

  const extractMetadata = async (file: File) => {
    setIsExtractingMetadata(true);
    try {
      const metadata = await parseBlob(file);

      const updates: Partial<typeof formData> = {};

      if (metadata.common.title && !formData.title) {
        updates.title = metadata.common.title;
      }

      if (metadata.common.artist && !formData.artist) {
        updates.artist = metadata.common.artist;
      }

      if (metadata.common.album && !formData.album) {
        updates.album = metadata.common.album;
      }

      if (metadata.common.year && !formData.year) {
        updates.year = metadata.common.year.toString();
      }

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({
          ...prev,
          ...updates,
        }));
        toast.success("Metadatos extraídos exitosamente");
      } else {
        toast.info("No se encontraron metadatos nuevos en el archivo");
      }
    } catch (error) {
      console.error("Error extracting metadata:", error);
      toast.error("Error al extraer metadatos del archivo");
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea un archivo de audio
      if (!file.type.startsWith("audio/")) {
        toast.error("Por favor selecciona un archivo de audio válido");
        return;
      }
      setAudioFile(file);

      // Extraer metadatos automáticamente
      await extractMetadata(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    if (!isEdit && !audioFile) {
      toast.error(t("audioRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("artist", formData.artist);
      data.append("album", formData.album);
      data.append("year", formData.year || "0");

      if (audioFile) {
        data.append("audio", audioFile);
      }

      if (isEdit && song) {
        // Actualizar canción existente
        await pb.collection("songs").update(song.id, data);
        toast.success("Canción actualizada exitosamente");
      } else {
        // Crear nueva canción
        await pb.collection("songs").create(data);
        toast.success("Canción creada exitosamente");
      }

      router.push("/admin/songs");
      router.refresh();
    } catch (error) {
      console.error("Error saving song:", error);
      toast.error("Error al guardar la canción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? "Editar Canción" : "Crear Nueva Canción"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t("title")} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={t("titlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">{t("artist")}</Label>
            <Input
              id="artist"
              value={formData.artist}
              onChange={(e) => handleInputChange("artist", e.target.value)}
              placeholder={t("artistPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album">{t("album")}</Label>
            <Input
              id="album"
              value={formData.album}
              onChange={(e) => handleInputChange("album", e.target.value)}
              placeholder={t("albumPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">{t("year")}</Label>
            <Input
              id="year"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.year}
              onChange={(e) => handleInputChange("year", e.target.value)}
              placeholder={t("yearPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio">
              {t("audio")} {!isEdit && "*"}
            </Label>
            <div className="relative">
              <Input
                id="audio"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="cursor-pointer"
                disabled={isExtractingMetadata}
              />
              <Upload className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {isExtractingMetadata && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Extrayendo metadatos...</span>
              </div>
            )}
            {audioFile && !isExtractingMetadata && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {audioFile.name}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => extractMetadata(audioFile)}
                  disabled={isExtractingMetadata}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Extraer metadatos
                </Button>
              </div>
            )}
            {isEdit && song?.audio && !audioFile && (
              <p className="text-sm text-muted-foreground">
                Archivo actual: {song.audio}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? t("processing") : t("uploading")}
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
