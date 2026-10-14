"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { DeckPDF } from "./deck-pdf";
import { CardsRecord, SongsRecord } from "@/lib/types/pocketbase";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type CardWithDetails = CardsRecord & {
  songData?: SongsRecord;
  qrCodeDataUrl?: string;
};

interface GeneratePDFButtonProps {
  cards: CardWithDetails[];
  deckName: string;
}

export function GeneratePDFButton({ cards, deckName }: GeneratePDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQRCodeDataUrl = async (songId: string): Promise<string> => {
    return new Promise((resolve) => {
      const url = songId;

      // Crear un SVG temporal del QR code
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.innerHTML = `
        <svg id="temp-qr-${songId}" xmlns="http://www.w3.org/2000/svg" width="300" height="300"></svg>
      `;
      document.body.appendChild(tempDiv);

      // Usar react-dom para renderizar el QRCodeSVG
      import("react-dom/client").then((ReactDOM) => {
        const root = ReactDOM.createRoot(tempDiv);
        root.render(
          <QRCodeSVG
            value={url}
            size={300}
            bgColor="#ffffff"
            fgColor="#000000"
            level="M"
            includeMargin={true}
          />
        );

        // Esperar un momento para que se renderice
        setTimeout(() => {
          const svg = tempDiv.querySelector("svg");
          if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            canvas.width = 300;
            canvas.height = 300;

            img.onload = () => {
              ctx?.drawImage(img, 0, 0, 300, 300);
              const dataUrl = canvas.toDataURL("image/png");
              root.unmount();
              document.body.removeChild(tempDiv);
              resolve(dataUrl);
            };

            img.onerror = () => {
              root.unmount();
              document.body.removeChild(tempDiv);
              resolve("");
            };

            img.src =
              "data:image/svg+xml;base64," +
              btoa(unescape(encodeURIComponent(svgData)));
          } else {
            root.unmount();
            document.body.removeChild(tempDiv);
            resolve("");
          }
        }, 100);
      });
    });
  };

  const handleGeneratePDF = async () => {
    if (cards.length === 0) {
      toast.error("No hay cards en este deck para generar el PDF");
      return;
    }

    setIsGenerating(true);
    try {
      // Debug: verificar datos de las cards
      console.log("Cards antes de generar PDF:", cards);
      cards.forEach((card) => {
        console.log(`Card ${card.id}:`, {
          type: card.type,
          songData: card.songData,
          title: card.songData?.title,
          artist: card.songData?.artist,
        });
      });

      // Generar los códigos QR para todas las cards
      const cardsWithQR = await Promise.all(
        cards.map(async (card) => {
          // Usar el ID de la song para el QR code
          const qrCodeDataUrl = card.song
            ? await generateQRCodeDataUrl(card.song)
            : "";
          return {
            ...card,
            qrCodeDataUrl,
          };
        })
      );

      const blob = await pdf(
        <DeckPDF cards={cardsWithQR} deckName={deckName} />
      ).toBlob();

      // Crear un enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${deckName.replace(/\s+/g, "_")}_cards.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF generado correctamente");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={isGenerating || cards.length === 0}
      variant="outline"
    >
      <FileDown className="mr-2 h-4 w-4" />
      {isGenerating ? "Generando PDF..." : "Generar PDF"}
    </Button>
  );
}
