import { AudioPlayer } from "@/components/player/audio-player";
import { HitsterErrorCard } from "@/components/player/hitster-error";
import { withBasePath } from "@/lib/base-path";
import { toErrorCode } from "@/lib/hitster/errors";
import { resolveHitsterCard } from "@/lib/hitster/resolve";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function HitsterPage({
  params,
}: {
  params: Promise<{ sku: string; card: string }>;
}) {
  const { sku, card } = await params;

  // Validate the card and warm the resolve cache. We deliberately do NOT pass
  // any song metadata to the player: a Hitster card must look and behave
  // exactly like any other card (generic UI, autoplay, no title/artist/cover).
  try {
    await resolveHitsterCard(sku, card);
  } catch (err) {
    return <HitsterErrorCard code={toErrorCode(err)} sku={sku} card={card} />;
  }

  const streamUrl = withBasePath(
    `/api/hitster/stream?sku=${encodeURIComponent(sku)}&card=${encodeURIComponent(
      card
    )}`
  );

  return <AudioPlayer audioUrl={streamUrl} debugId={`${sku}/${card}`} />;
}
