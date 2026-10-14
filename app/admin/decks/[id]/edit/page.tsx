import { notFound } from "next/navigation";
import { DeckForm } from "@/components/admin/deck-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";
import { DecksRecord } from "@/lib/types/pocketbase";
import { getTranslations } from "next-intl/server";

async function getDeck(id: string): Promise<DecksRecord | null> {
  try {
    const deck = await pb.collection("decks").getOne<DecksRecord>(id);
    return deck;
  } catch (error) {
    console.error("Error fetching deck:", error);
    return null;
  }
}

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await getDeck(id);
  const t = await getTranslations("admin.decks");

  if (!deck) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/decks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{t("editDeck")}</h2>
          <p className="text-sm text-muted-foreground">Editando: {deck.name}</p>
        </div>
      </div>

      <DeckForm deck={deck} isEdit={true} />
    </div>
  );
}
