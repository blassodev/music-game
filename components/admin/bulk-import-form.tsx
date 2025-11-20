"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Upload, CheckCircle, XCircle, Music } from "lucide-react";
import { toast } from "sonner";
import pb from "@/lib/pocketbase";
import {
  extractAudioMetadata,
  filterAudioFiles,
} from "@/lib/utils/audio-metadata";

interface SongMetadata {
  file: File;
  title: string;
  artist: string;
  album: string;
  year: number;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
}

export function BulkImportForm() {
  const router = useRouter();
  const t = useTranslations("admin.songs.bulkImport");
  const tCommon = useTranslations("common");

  const [songs, setSongs] = useState<SongMetadata[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Filtrar solo archivos de audio
    const audioFiles = filterAudioFiles(files);

    if (audioFiles.length === 0) {
      toast.error("No se encontraron archivos de audio válidos");
      return;
    }

    setIsExtractingMetadata(true);
    toast.info("Extrayendo metadatos de archivos de audio...");

    // Extraer metadatos de cada archivo
    const extractedSongs: SongMetadata[] = [];

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      try {
        const metadata = await extractAudioMetadata(file);

        // Log para debugging (puedes eliminarlo después)
        console.log(`Metadatos extraídos de ${file.name}:`, metadata);

        extractedSongs.push({
          file,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          artist: metadata.artist || "Desconocido",
          album: metadata.album || "Desconocido",
          // Si no hay año en los metadatos, usar año actual como fallback razonable
          year: metadata.year || new Date().getFullYear(),
          status: "pending" as const,
        });
      } catch (error) {
        console.error("Error extracting metadata:", error);
        extractedSongs.push({
          file,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Desconocido",
          album: "Desconocido",
          year: new Date().getFullYear(),
          status: "pending" as const,
        });
      }
    }

    setSongs(extractedSongs);
    setIsExtractingMetadata(false);
    toast.success(
      `${extractedSongs.length} archivo(s) procesado(s) con metadatos extraídos`
    );
  };

  const handleBulkImport = async () => {
    if (songs.length === 0) {
      toast.error("No hay canciones para importar");
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Actualizar estado a "processing"
      setSongs((prev) =>
        prev.map((song) => ({ ...song, status: "processing" }))
      );

      let successCount = 0;
      let errorCount = 0;

      // Procesar cada canción individualmente
      for (let i = 0; i < songs.length; i++) {
        const song = songs[i];

        try {
          const formData = new FormData();
          formData.append("title", song.title);
          formData.append("artist", song.artist);
          formData.append("album", song.album);
          formData.append("year", song.year.toString());
          formData.append("audio", song.file);

          // Crear directamente en PocketBase
          await pb.collection("songs").create(formData);

          successCount++;

          // Actualizar estado de esta canción a "success"
          setSongs((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: "success" } : s))
          );
        } catch (error) {
          console.error(`Error importing song ${song.title}:`, error);
          errorCount++;

          // Actualizar estado de esta canción a "error"
          setSongs((prev) =>
            prev.map((s, idx) =>
              idx === i
                ? {
                    ...s,
                    status: "error",
                    error:
                      error instanceof Error
                        ? error.message
                        : "Error desconocido",
                  }
                : s
            )
          );
        }

        // Actualizar progreso
        setProgress(Math.round(((i + 1) / songs.length) * 100));
      }

      if (errorCount === 0) {
        toast.success(
          `¡${successCount} canción(es) importada(s) exitosamente!`
        );
        setTimeout(() => {
          router.push("/admin/songs");
          router.refresh();
        }, 2000);
      } else {
        toast.warning(
          `${successCount} importada(s), ${errorCount} con errores`
        );
      }
    } catch (error) {
      console.error("Error durante la importación masiva:", error);
      toast.error("Error durante la importación masiva");
      setSongs((prev) =>
        prev.map((song) =>
          song.status === "processing"
            ? { ...song, status: "error", error: "Error de red" }
            : song
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const updateSongData = (
    index: number,
    field: keyof SongMetadata,
    value: string | number
  ) => {
    setSongs((prev) =>
      prev.map((song, i) => (i === index ? { ...song, [field]: value } : song))
    );
  };

  const removeSong = (index: number) => {
    setSongs((prev) => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: SongMetadata["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Music className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: SongMetadata["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Éxito</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "processing":
        return <Badge>Procesando...</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivos de Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="audio-files"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click para seleccionar</span>{" "}
                  o arrastra archivos
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV, OGG, M4A, AAC, FLAC
                </p>
              </div>
              <input
                id="audio-files"
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isProcessing || isExtractingMetadata}
              />
            </label>
          </div>

          {songs.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                {songs.length} archivo(s) seleccionado(s)
              </p>
              <Button
                onClick={handleBulkImport}
                disabled={isProcessing || isExtractingMetadata}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar {songs.length} Canción(es)
                  </>
                )}
              </Button>
            </div>
          )}

          {isExtractingMetadata && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Extrayendo metadatos de los archivos de audio...
                </p>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">
                Importando canciones...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {songs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Canciones a Importar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Estado</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Artista</TableHead>
                  <TableHead>Álbum</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {songs.map((song, index) => (
                  <TableRow key={index}>
                    <TableCell>{getStatusIcon(song.status)}</TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={song.title}
                        onChange={(e) =>
                          updateSongData(index, "title", e.target.value)
                        }
                        disabled={isProcessing}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={song.artist}
                        onChange={(e) =>
                          updateSongData(index, "artist", e.target.value)
                        }
                        disabled={isProcessing}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={song.album}
                        onChange={(e) =>
                          updateSongData(index, "album", e.target.value)
                        }
                        disabled={isProcessing}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        value={song.year}
                        onChange={(e) =>
                          updateSongData(
                            index,
                            "year",
                            parseInt(e.target.value) || new Date().getFullYear()
                          )
                        }
                        disabled={isProcessing}
                        className="w-20 px-2 py-1 border rounded text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSong(index)}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
