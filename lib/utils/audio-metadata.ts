/**
 * Utilidades para extraer metadatos de archivos de audio
 */

import { parseBlob } from "music-metadata-browser";

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  duration?: number;
  genre?: string;
}

/**
 * Extrae metadatos de un archivo de audio usando music-metadata-browser
 * que lee los tags ID3 reales del archivo
 */
export async function extractAudioMetadata(file: File): Promise<AudioMetadata> {
  try {
    // Intentar extraer metadatos usando music-metadata-browser
    const metadata = await parseBlob(file);

    console.log(`Metadatos ID3 de ${file.name}:`, {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
    });

    const extractedMetadata: AudioMetadata = {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      year: metadata.common.year,
      duration: metadata.format.duration,
      genre: metadata.common.genre?.[0],
    };

    // Obtener metadatos del nombre del archivo como fallback
    const fileMetadata = extractMetadataFromFilename(file.name);
    const yearFromFilename = extractYearFromFilename(file.name);

    console.log(
      `Metadatos del nombre de archivo ${file.name}:`,
      fileMetadata,
      "Año:",
      yearFromFilename
    );

    // Combinar metadatos: priorizar los del archivo, usar nombre como fallback
    const result = {
      title: extractedMetadata.title || fileMetadata.title,
      artist: extractedMetadata.artist || fileMetadata.artist,
      album: extractedMetadata.album || fileMetadata.album,
      year: extractedMetadata.year || yearFromFilename,
      duration: extractedMetadata.duration,
      genre: extractedMetadata.genre,
    };

    console.log(`Resultado final para ${file.name}:`, result);

    return result;
  } catch (error) {
    console.error(
      "Error extracting audio metadata with music-metadata-browser:",
      error
    );
    // Si falla, al menos intentar extraer del nombre del archivo
    return extractMetadataFromFilename(file.name);
  }
}

/**
 * Extrae metadatos del nombre del archivo
 * Soporta varios formatos comunes:
 * - "Artista - Título.mp3"
 * - "Artista - Álbum - Título.mp3"
 * - "Título.mp3"
 */
export function extractMetadataFromFilename(filename: string): AudioMetadata {
  // Remover la extensión del archivo
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Dividir por " - "
  const parts = nameWithoutExt.split(" - ").map((p) => p.trim());

  if (parts.length >= 3) {
    // Formato: "Artista - Álbum - Título"
    return {
      artist: parts[0],
      album: parts[1],
      title: parts[2],
    };
  } else if (parts.length === 2) {
    // Formato: "Artista - Título"
    return {
      artist: parts[0],
      title: parts[1],
    };
  } else {
    // Solo el título
    return {
      title: nameWithoutExt,
    };
  }
}

/**
 * Extrae el año del nombre del archivo si está presente
 * Busca un número de 4 dígitos que parezca un año (1900-2099)
 */
export function extractYearFromFilename(filename: string): number | undefined {
  const yearMatch = filename.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }
  return undefined;
}

/**
 * Procesa múltiples archivos de audio y extrae sus metadatos
 */
export async function extractBulkMetadata(
  files: File[]
): Promise<AudioMetadata[]> {
  const promises = files.map((file) => extractAudioMetadata(file));
  return Promise.all(promises);
}

/**
 * Valida que un archivo sea de audio
 */
export function isAudioFile(file: File): boolean {
  // Verificar por tipo MIME
  if (file.type.startsWith("audio/")) {
    return true;
  }

  // Verificar por extensión
  const audioExtensions = [
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".aac",
    ".flac",
    ".wma",
    ".opus",
  ];
  const filename = file.name.toLowerCase();

  return audioExtensions.some((ext) => filename.endsWith(ext));
}

/**
 * Filtra una lista de archivos para obtener solo los de audio
 */
export function filterAudioFiles(files: File[]): File[] {
  return files.filter(isAudioFile);
}

/**
 * Formatea la duración en segundos a mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
