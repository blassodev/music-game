import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/player/audio-player";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";

async function getSongByCardCode(
  cardCode: string
): Promise<SongsRecord | null> {
  try {
    // En el nuevo sistema, el cardCode es el ID de la canción
    const song = await pb.collection("songs").getOne<SongsRecord>(cardCode);
    return song;
  } catch (error) {
    console.error("Error fetching song:", error);
    return null;
  }
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ cardCode: string }>;
}) {
  const { cardCode } = await params;
  const song = await getSongByCardCode(cardCode);

  if (!song) {
    notFound();
  }

  if (!song.audio) {
    notFound();
  }

  // Pasar la canción completa al componente para que genere la URL del lado del cliente
  return <AudioPlayer song={song} />;
}
