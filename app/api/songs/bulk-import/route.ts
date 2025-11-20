import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

const pb = new PocketBase(
  process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pb-musica.blassanto.me"
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Obtener el payload JSON
    const jsonPayloadString = formData.get("@jsonPayload") as string;
    if (!jsonPayloadString) {
      return NextResponse.json(
        { error: "Missing @jsonPayload" },
        { status: 400 }
      );
    }

    const { requests } = JSON.parse(jsonPayloadString);

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: "Invalid requests array" },
        { status: 400 }
      );
    }

    // Crear el batch de PocketBase
    const batch = pb.createBatch();

    // Agregar cada request al batch
    requests.forEach(
      (
        req: { method: string; url: string; body: Record<string, unknown> },
        index: number
      ) => {
        const audioFile = formData.get(`requests.${index}.audio`) as File;

        if (!audioFile) {
          throw new Error(`Missing audio file for request ${index}`);
        }

        // Preparar los datos para crear el registro
        const recordData = {
          ...req.body,
          audio: audioFile,
        };

        // Agregar al batch
        batch.collection("songs").create(recordData);
      }
    );

    // Ejecutar el batch
    const results = await batch.send();

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in bulk import:", error);
    return NextResponse.json(
      {
        error: "Failed to import songs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
