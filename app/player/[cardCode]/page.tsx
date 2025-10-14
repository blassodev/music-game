import { notFound } from "next/navigation";
import { AudioPlayer } from "@/components/player/audio-player";
import { getSongByCardCode } from "@/lib/mock-data";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ cardCode: string }>;
}) {
  const { cardCode } = await params;
  const song = getSongByCardCode(cardCode);

  if (!song) {
    notFound();
  }

  return <AudioPlayer audioUrl={song.audioUrl} />;
}
