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
import { Loader2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import pb from "@/lib/pocketbase";

interface VideoInfo {
  title: string;
  author: string;
  lengthSeconds: string;
  description: string;
  thumbnail: string;
  qualities: Array<{
    itag: number;
    quality: string;
    audioBitrate: number;
    audioCodec: string;
    container: string;
    url: string;
  }>;
}

export function UrlImportForm() {
  const router = useRouter();
  const t = useTranslations("admin.songs.import");
  const tCommon = useTranslations("common");

  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const remainingSeconds = sec % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleFetchInfo = async () => {
    if (!url) {
      toast.error(t("urlRequired"));
      return;
    }

    if (!isValidYouTubeUrl(url)) {
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

      // Seleccionar automáticamente la mejor calidad disponible
      if (data.qualities && data.qualities.length > 0) {
        const bestQuality = data.qualities.reduce((best: VideoInfo['qualities'][0], current: VideoInfo['qualities'][0]) => {
          return (current.audioBitrate || 0) > (best.audioBitrate || 0)
            ? current
            : best;
        });
        setSelectedQuality(bestQuality.itag.toString());
      }

      toast.success("Información obtenida exitosamente");
    } catch (error) {
      console.error("Error fetching video info:", error);
      toast.error(t("fetchError"));
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = async () => {
    if (!videoInfo || !selectedQuality) {
      toast.error("Please fetch video info and select quality first");
      return;
    }

    setIsImporting(true);
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

      // Crear FormData para PocketBase
      const formData = new FormData();
      formData.append("title", videoInfo.title);
      formData.append("artist", videoInfo.author);
      formData.append("album", ""); // YouTube no proporciona información de álbum
      formData.append("year", new Date().getFullYear().toString());
      formData.append("audio", audioBlob, `${videoInfo.title}.mp3`);

      // Subir a PocketBase
      await pb.collection("songs").create(formData);

      toast.success(t("importSuccess"));
      router.push("/admin/songs");
      router.refresh();
    } catch (error) {
      console.error("Error importing song:", error);
      toast.error(t("downloadError"));
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* URL Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pageTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Button onClick={handleFetchInfo} disabled={isFetching || !url}>
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("fetching")}
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("fetchInfo")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Info Section */}
      {videoInfo && (
        <Card>
          <CardHeader>
            <CardTitle>{t("videoInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Thumbnail and basic info */}
              <div className="space-y-4">
                {videoInfo.thumbnail && (
                  <Image
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    width={400}
                    height={225}
                    className="w-full rounded-lg"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{videoInfo.title}</h3>
                  <p className="text-muted-foreground">{videoInfo.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("duration")}: {formatDuration(videoInfo.lengthSeconds)}
                  </p>
                </div>
              </div>

              {/* Quality selection and import */}
              <div className="space-y-4">
                <div className="space-y-2">
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
                          {quality.audioBitrate
                            ? `${quality.audioBitrate}kbps`
                            : quality.quality}
                          ({quality.audioCodec}) - {quality.container}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleImport}
                    disabled={isImporting || !selectedQuality}
                    className="w-full"
                  >
                    {isImporting ? (
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

                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isImporting}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
