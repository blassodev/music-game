"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Info } from "lucide-react";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

interface VideoInfo {
  title: string;
  author: string;
  lengthSeconds: string;
  description?: string;
  thumbnail?: string;
  qualities: Array<{
    itag: number;
    quality: string;
    audioBitrate?: number;
    audioCodec?: string;
    container?: string;
  }>;
}

export function UrlSongForm() {
  const router = useRouter();
  const t = useTranslations("admin.songs.import");
  const tForm = useTranslations("admin.songs.form");

  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    album: "",
    year: "",
  });

  const [isFetching, setIsFetching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      toast.error(t("urlRequired"));
      return;
    }

    if (!validateUrl(url)) {
      toast.error(t("invalidUrl"));
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch("/api/songs/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch video info");
      }

      const data = await response.json();
      setVideoInfo(data);

      // Auto-rellenar el formulario con la información del video
      setFormData({
        title: data.title || "",
        artist: data.author || "",
        album: "",
        year: new Date().getFullYear().toString(),
      });

      // Seleccionar la mejor calidad por defecto
      if (data.qualities && data.qualities.length > 0) {
        const bestQuality = data.qualities.reduce(
          (
            best: VideoInfo["qualities"][0],
            current: VideoInfo["qualities"][0]
          ) => {
            return (current.audioBitrate || 0) > (best.audioBitrate || 0)
              ? current
              : best;
          }
        );
        setSelectedQuality(bestQuality.itag.toString());
      }

      toast.success("Información del video obtenida exitosamente");
    } catch (error) {
      console.error("Error fetching video info:", error);
      toast.error(t("fetchError"));
    } finally {
      setIsFetching(false);
    }
  };

  const downloadAndImport = async () => {
    if (!videoInfo || !selectedQuality) {
      toast.error("Selecciona una calidad de audio");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    setIsDownloading(true);
    try {
      // Descargar el audio
      const downloadResponse = await fetch(
        `/api/songs/import?url=${encodeURIComponent(
          url
        )}&itag=${selectedQuality}`
      );

      if (!downloadResponse.ok) {
        throw new Error("Failed to download audio");
      }

      // Convertir la respuesta a blob
      const audioBlob = await downloadResponse.blob();

      // Crear un archivo desde el blob
      const filename = `${formData.title
        .replace(/[^\w\s-]/gi, "")
        .replace(/\s+/g, "_")}.mp3`;
      const audioFile = new File([audioBlob], filename, { type: "audio/mpeg" });

      // Crear FormData para subir a PocketBase
      const data = new FormData();
      data.append("title", formData.title);
      data.append("artist", formData.artist);
      data.append("album", formData.album);
      data.append("year", formData.year || "0");
      data.append("audio", audioFile);

      // Guardar en PocketBase
      await pb.collection("songs").create(data);

      toast.success(t("importSuccess"));
      router.push("/admin/songs");
      router.refresh();
    } catch (error) {
      console.error("Error downloading and importing:", error);
      toast.error(t("downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds);
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = sec % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("pageTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">{t("url")} *</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("urlPlaceholder")}
                className="flex-1"
              />
              <Button
                onClick={fetchVideoInfo}
                disabled={isFetching || !url.trim()}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("fetching")}
                  </>
                ) : (
                  <>
                    <Info className="mr-2 h-4 w-4" />
                    {t("fetchInfo")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Video Preview */}
          {videoInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("videoInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    {videoInfo.thumbnail && (
                      <Image
                        src={videoInfo.thumbnail}
                        alt="Video thumbnail"
                        width={300}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-semibold truncate">
                      {videoInfo.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {videoInfo.author}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {t("duration")}:{" "}
                        {formatDuration(videoInfo.lengthSeconds)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quality">{t("quality")}</Label>
                    <Select
                      value={selectedQuality}
                      onValueChange={setSelectedQuality}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectQuality")} />
                      </SelectTrigger>
                      <SelectContent>
                        {videoInfo.qualities.map((quality) => (
                          <SelectItem
                            key={quality.itag}
                            value={quality.itag.toString()}
                          >
                            {quality.quality} -{" "}
                            {quality.audioBitrate || "Unknown"}kbps
                            {quality.audioCodec && ` (${quality.audioCodec})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Song Form */}
          {videoInfo && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Información de la Canción
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">{tForm("title")} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={tForm("titlePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="artist">{tForm("artist")}</Label>
                  <Input
                    id="artist"
                    value={formData.artist}
                    onChange={(e) =>
                      handleInputChange("artist", e.target.value)
                    }
                    placeholder={tForm("artistPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="album">{tForm("album")}</Label>
                  <Input
                    id="album"
                    value={formData.album}
                    onChange={(e) => handleInputChange("album", e.target.value)}
                    placeholder={tForm("albumPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">{tForm("year")}</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    placeholder={tForm("yearPlaceholder")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            {videoInfo && (
              <Button
                onClick={downloadAndImport}
                disabled={
                  isDownloading || !selectedQuality || !formData.title.trim()
                }
                className="flex-1"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("downloading")}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t("submit")}
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isDownloading}
            >
              {tForm("cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
