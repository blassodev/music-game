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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, Download, ExternalLink, Search, Music } from "lucide-react";
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

interface DeezerSearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_id: string;
  duration: number;
  preview: string;
  cover: string;
  cover_big: string;
  type: "track";
}

export function UrlImportForm() {
  const router = useRouter();
  const t = useTranslations("admin.songs.import");
  const tCommon = useTranslations("common");

  const [activeTab, setActiveTab] = useState<string>("url");
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [searchResults, setSearchResults] = useState<DeezerSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<DeezerSearchResult | null>(null);
  const [selectedQuality, setSelectedQuality] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const isValidDeezerUrl = (url: string) => {
    return /(www\.)?deezer\.com\/|deezer\.page\.link/i.test(url);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDeezerImport = async () => {
    setIsFetching(true);
    try {
      const response = await fetch("/api/songs/import-deezer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pb-token": pb.authStore.token,
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import from Deezer");
      }

      toast.success(
        data.count > 1
          ? `${data.count} canciones importadas desde Deezer`
          : t("importSuccess")
      );
      if (data.failed?.length) {
        toast.warning(`${data.failed.length} archivo(s) fallaron`);
      }
      router.push("/admin/songs");
      router.refresh();
    } catch (error) {
      console.error("Error importing from Deezer:", error);
      toast.error(
        error instanceof Error ? error.message : t("downloadError")
      );
    } finally {
      setIsFetching(false);
    }
  };

  const handleResultSelect = (result: DeezerSearchResult) => {
    setSelectedResult(result);
    // Construir URL de Deezer para el track
    const trackUrl = `https://www.deezer.com/track/${result.id}`;
    setUrl(trackUrl);
    // Cambiar a tab URL para mostrar la preview
    setActiveTab("url");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast.error("La búsqueda debe tener al menos 2 caracteres");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/songs/search-deezer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery.trim(), limit: 20 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la búsqueda");
      }

      setSearchResults(data.results || []);
      if (data.results?.length > 0) {
        toast.success(`${data.count} resultados encontrados`);
      } else {
        toast.info("No se encontraron resultados");
      }
    } catch (error) {
      console.error("Error searching Deezer:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al buscar en Deezer"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleFetchInfo = async () => {
    if (!url) {
      toast.error(t("urlRequired"));
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      if (isValidDeezerUrl(url)) {
        // Deezer: descarga directa con streamrip (sin paso de "info")
        await handleDeezerImport();
        return;
      }
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
      {/* Tabs for URL / Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("tabUrl")}
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="mr-2 h-4 w-4" />
            {t("tabSearch")}
          </TabsTrigger>
        </TabsList>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-6">
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
                  <Button
                    onClick={handleFetchInfo}
                    disabled={isFetching || !url.trim()}
                  >
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
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("searchTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">{t("searchLabel")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim() || searchQuery.trim().length < 2}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("searching")}
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        {t("searchBtn")}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("searchHint")}
                </p>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium">
                    {t("searchResults")} ({searchResults.length})
                  </p>
                  {searchResults.map((result) => (
                    <Button
                      key={result.id}
                      variant={selectedResult?.id === result.id ? "default" : "outline"}
                      onClick={() => handleResultSelect(result)}
                      className="w-full justify-start gap-3 p-3"
                    >
                      {result.cover && (
                        <Image
                          src={result.cover}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate">{result.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.artist} · {result.album}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(result.duration)}
                        </p>
                      </div>
                      {selectedResult?.id === result.id && (
                        <Music className="h-5 w-5 text-primary" />
                      )}
                    </Button>
                  ))}
                </div>
              )}

              {selectedResult && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">{t("selectedTrack")}</p>
                  <p className="font-medium">{selectedResult.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedResult.artist} · {selectedResult.album}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedResult(null);
                      setUrl("");
                    }}
                  >
                    {t("clearSelection")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Info Section (shown when URL is fetched or search result selected) */}
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
                    {t("duration")}: {formatDuration(parseInt(videoInfo.lengthSeconds))}
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
                    onClick={isValidDeezerUrl(url) ? handleDeezerImport : handleImport}
                    disabled={
                      isImporting || isFetching || !selectedQuality
                    }
                    className="w-full"
                  >
                    {isImporting || isFetching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isValidDeezerUrl(url) ? t("importing") : t("downloading")}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {isValidDeezerUrl(url) ? t("importDeezer") : t("submit")}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isImporting || isFetching}
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
