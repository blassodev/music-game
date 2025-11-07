import { notFound } from "next/navigation";
import pb from "@/lib/pocketbase";
import { DecksRecord, CardsRecord, SongsRecord } from "@/lib/types/pocketbase";
import { DeckDetailClient } from "@/components/admin/deck-detail-client";

type CardWithDetails = CardsRecord & {
  songData?: SongsRecord;
};

async function getDeckWithCards(id: string) {
  try {
    const deck = await pb.collection("decks").getOne<DecksRecord>(id);
    let cards: CardWithDetails[] = [];

    if (deck.cards && deck.cards.length > 0) {
      // Obtener todas las cards del deck
      const fetchedCards = await pb
        .collection("cards")
        .getFullList<CardsRecord>({
          filter: deck.cards.map((cardId) => `id='${cardId}'`).join(" || "),
        });

      // Para cada card, si es de tipo 'song', obtener los datos de la canción
      cards = await Promise.all(
        fetchedCards.map(async (card) => {
          if (card.type === "song" && card.song) {
            try {
              const songData = await pb
                .collection("songs")
                .getOne<SongsRecord>(card.song);
              return { ...card, songData };
            } catch (error) {
              console.error(`Error fetching song ${card.song}:`, error);
              return card;
            }
          }
          return card;
        })
      );
    }

    return { deck, cards };
  } catch (error) {
    console.error("Error fetching deck:", error);
    return null;
  }
}

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getDeckWithCards(id);

  if (!result) {
    notFound();
  }

  const { deck, cards } = result;

  return <DeckDetailClient deck={deck} initialCards={cards} />;
}
