"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Plus } from "lucide-react";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { toast } from "sonner";

interface AddCardToDeckProps {
  deckId: string;
  onCardAdded: () => void;
}

type CardType = "song" | "ost" | "opening" | "ad";

const ITEMS_PER_PAGE = 20;

export function AddCardToDeck({ deckId, onCardAdded }: AddCardToDeckProps) {
  const [open, setOpen] = useState(false);
  const [cardType, setCardType] = useState<CardType>("song");
  const [year, setYear] = useState("");

  // Para selección de canción (todos los tipos)
  const [songs, setSongs] = useState<SongsRecord[]>([]);
  const [selectedSong, setSelectedSong] = useState("");
  const [searchSongQuery, setSearchSongQuery] = useState("");
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Para otros tipos (campos adicionales)
  const [textContent, setTextContent] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs para scroll infinito
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Cargar canciones cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetchSongs(1, "");
    }
  }, [open]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Reset form cuando cambia el tipo
  useEffect(() => {
    setSelectedSong("");
    setTextContent("");
    setYear("");
  }, [cardType]);

  // Buscar canciones en la base de datos con paginación
  const fetchSongs = async (page: number, search: string) => {
    const isFirstPage = page === 1;

    if (isFirstPage && search === "") {
      // Solo mostrar loading completo en la carga inicial
      setLoadingSongs(true);
    } else if (!isFirstPage) {
      setLoadingMore(true);
    }
    // Si es búsqueda, no mostramos loadingSongs para que el input no desaparezca

    try {
      // Verificar autenticación antes de hacer la petición
      if (!pb.authStore.isValid) {
        console.error("Auth store is not valid");
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return;
      }

      // Intentar refrescar el token antes de hacer la petición
      try {
        await pb.collection("users").authRefresh();
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        return;
      }

      // Construir el filtro de búsqueda
      let filter = "";
      if (search.trim()) {
        const searchTerm = search.trim();
        filter = `title ~ "${searchTerm}" || artist ~ "${searchTerm}" || album ~ "${searchTerm}"`;
      }

      // Obtener canciones con paginación
      const result = await pb
        .collection("songs")
        .getList<SongsRecord>(page, ITEMS_PER_PAGE, {
          sort: "-createdAt",
          filter: filter,
          requestKey: `songs-search-${search}-${page}`, // Key única para cada búsqueda
        });

      if (isFirstPage) {
        setSongs(result.items);
      } else {
        setSongs((prev) => [...prev, ...result.items]);
      }

      setTotalItems(result.totalItems);
      setHasMore(result.page < result.totalPages);
      setCurrentPage(result.page);
    } catch (error: any) {
      console.error("Error fetching songs:", error);
      console.error("Error status:", error?.status);
      console.error("Error data:", error?.data);

      // Manejar error de autenticación específicamente
      if (error?.status === 401 || error?.status === 403) {
        toast.error("Sesión expirada. Por favor, inicia sesión nuevamente.");
      } else if (error?.status === 400) {
        toast.error(
          "Error al cargar las canciones. Verifica los permisos en PocketBase."
        );
        console.error("Error details:", error.data || error.message);
      } else {
        toast.error("Error al cargar las canciones");
      }
    } finally {
      setLoadingSongs(false);
      setLoadingMore(false);
    }
  };

  // Manejar búsqueda con debounce
  const handleSearch = useCallback((query: string) => {
    setSearchSongQuery(query);

    // Limpiar timeout anterior (cancela la búsqueda anterior)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Crear nuevo timeout - esperar 500ms después de que el usuario pare de escribir
    searchTimeoutRef.current = setTimeout(() => {
      fetchSongs(1, query);
    }, 500);
  }, []);

  // Manejar scroll infinito
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || loadingMore || !hasMore) return;

    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // Cargar más cuando estemos cerca del final (90%)
    if (scrollPosition >= scrollHeight * 0.9) {
      fetchSongs(currentPage + 1, searchSongQuery);
    }
  }, [currentPage, searchSongQuery, loadingMore, hasMore]);

  const getCardTypeLabel = (type: CardType) => {
    const labels: Record<CardType, string> = {
      song: "Canción",
      ost: "OST / Banda Sonora",
      opening: "Opening / Intro",
      ad: "Anuncio",
    };
    return labels[type];
  };

  const handleSubmit = async () => {
    // Validar que haya una canción seleccionada
    if (!selectedSong) {
      toast.error("Selecciona una canción");
      return;
    }

    // Validar campos adicionales según el tipo
    if (cardType === "ost" && !textContent.trim()) {
      toast.error(`Ingresa el ${getCardTypeLabel(cardType)}`);
      return;
    }
    if (cardType === "opening" && !textContent.trim()) {
      toast.error(`Ingresa el ${getCardTypeLabel(cardType)}`);
      return;
    }
    if (cardType === "ad" && !textContent.trim()) {
      toast.error(`Ingresa el ${getCardTypeLabel(cardType)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Primero crear la nueva card
      const cardData: any = {
        type: cardType,
        song: selectedSong, // ID de la canción
      };

      // Añadir campos adicionales según el tipo
      if (cardType === "ost" && textContent.trim()) {
        cardData.ost = textContent.trim();
      }
      if (cardType === "opening" && textContent.trim()) {
        cardData.opening = textContent.trim();
      }
      if (cardType === "ad" && textContent.trim()) {
        cardData.ad = textContent.trim();
      }

      // Añadir año si está disponible
      if (year.trim()) {
        cardData.year = year.trim();
      }

      // Crear la card
      const newCard = await pb.collection("cards").create(cardData);

      // 2. Obtener el deck actual
      const deck = await pb.collection("decks").getOne(deckId);

      // 3. Añadir la nueva card al array de cards
      const currentCards: string[] = Array.isArray(deck.cards)
        ? deck.cards
        : [];
      const updatedCards = [...currentCards, newCard.id];

      // 4. Actualizar el deck con el array actualizado
      await pb.collection("decks").update(deckId, {
        name: deck.name,
        cards: updatedCards,
        ...(deck.description && { description: deck.description }),
        ...(deck.isActive !== undefined && { isActive: deck.isActive }),
      });

      toast.success("Card creada y añadida exitosamente");

      // Reset form
      setSelectedSong("");
      setTextContent("");
      setYear("");
      setSearchSongQuery("");
      setSongs([]);
      setCurrentPage(1);
      setHasMore(true);
      setOpen(false);
      onCardAdded();
    } catch (error) {
      console.error("Error creating card:", error);
      toast.error("Error al crear la card");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Crear Nueva Card</DialogTitle>
          <DialogDescription>
            Crea una nueva card y añádela al mazo
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {/* Selector de tipo de card */}
          <div className="space-y-2">
            <Label htmlFor="card-type">Tipo de Card *</Label>
            <Select
              value={cardType}
              onValueChange={(value) => setCardType(value as CardType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="song">Canción</SelectItem>
                <SelectItem value="ost">OST / Banda Sonora</SelectItem>
                <SelectItem value="opening">Opening / Intro</SelectItem>
                <SelectItem value="ad">Anuncio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campos adicionales según el tipo (antes del buscador) */}
          {cardType === "ost" && (
            <div className="space-y-2">
              <Label htmlFor="ost-content">
                Nombre de la OST / Banda Sonora *
              </Label>
              <Input
                id="ost-content"
                type="text"
                placeholder="Ej: The Last of Us Soundtrack"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de la banda sonora o tema específico
              </p>
            </div>
          )}

          {cardType === "opening" && (
            <div className="space-y-2">
              <Label htmlFor="opening-content">
                Nombre del Opening / Intro *
              </Label>
              <Input
                id="opening-content"
                type="text"
                placeholder="Ej: Breaking Bad Opening"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre del opening o intro de la serie/película
              </p>
            </div>
          )}

          {cardType === "ad" && (
            <div className="space-y-2">
              <Label htmlFor="ad-content">
                Nombre o Descripción del Anuncio *
              </Label>
              <Input
                id="ad-content"
                type="text"
                placeholder="Ej: Anuncio de Coca Cola"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nombre o descripción del anuncio publicitario
              </p>
            </div>
          )}

          {/* Campo de año (solo para OST, Opening y Ad) */}
          {cardType !== "song" && (
            <div className="space-y-2">
              <Label htmlFor="year">Año (opcional)</Label>
              <Input
                id="year"
                type="text"
                placeholder="Ej: 2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          )}

          {/* Selector de canción (siempre visible) */}
          <div className="space-y-2">
            <Label>Seleccionar Canción *</Label>

            {/* Input de búsqueda - siempre visible */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, artista, álbum..."
                value={searchSongQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {searchSongQuery && (
              <p className="text-xs text-muted-foreground">
                {totalItems} canción{totalItems !== 1 ? "es" : ""} encontrada
                {totalItems !== 1 ? "s" : ""}
              </p>
            )}

            {/* Contenedor de canciones */}
            {loadingSongs ? (
              <div className="flex items-center justify-center py-8 border rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando canciones...</span>
              </div>
            ) : songs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 border rounded-lg">
                No se encontraron canciones
              </p>
            ) : (
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="border rounded-lg max-h-64 overflow-y-auto"
              >
                <div className="divide-y">
                  {songs.map((song) => (
                    <div
                      key={song.id}
                      onClick={() => setSelectedSong(song.id)}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedSong === song.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="font-medium">{song.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {song.artist && song.album
                          ? `${song.artist} • ${song.album}`
                          : song.artist || song.album || "Sin información"}
                        {song.year && ` • ${song.year}`}
                      </div>
                    </div>
                  ))}

                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Cargando más...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedSong ||
              ((cardType === "ost" ||
                cardType === "opening" ||
                cardType === "ad") &&
                !textContent.trim())
            }
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear y Añadir Card"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
