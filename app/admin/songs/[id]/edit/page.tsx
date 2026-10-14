import { notFound } from "next/navigation";
import { SongForm } from "@/components/admin/song-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { getTranslations } from "next-intl/server";

async function getSong(id: string): Promise<SongsRecord | null> {
  try {
    const song = await pb.collection("songs").getOne<SongsRecord>(id);
    return song;
  } catch (error) {
    console.error("Error fetching song:", error);
    return null;
  }
}

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const song = await getSong(id);
  const t = await getTranslations("admin.songs");

  if (!song) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/songs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{t("editSong")}</h2>
          <p className="text-sm text-muted-foreground">
            Editando: {song.title}
          </p>
        </div>
      </div>

      <SongForm song={song} isEdit={true} />
    </div>
  );
}
