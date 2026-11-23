import { HitsterErrorCard } from "@/components/player/hitster-error";
import { HitsterPlayer } from "@/components/player/hitster-player";
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

  try {
    const meta = await resolveHitsterCard(sku, card);
    return <HitsterPlayer meta={meta} />;
  } catch (err) {
    return <HitsterErrorCard code={toErrorCode(err)} sku={sku} card={card} />;
  }
}
