"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

interface SongQRCodeProps {
  songId: string;
  songTitle?: string;
  size?: number;
  modalSize?: number;
  showIcon?: boolean;
}

export function SongQRCode({
  songId,
  songTitle,
  size = 24,
  modalSize = 256,
  showIcon = false,
}: SongQRCodeProps) {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-modal-${songId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `song-${songId}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="flex justify-center">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="p-1 h-auto hover:bg-muted transition-colors"
            title="Ver código QR"
          >
            {showIcon ? (
              <QrCode className="h-5 w-5" />
            ) : (
              <QRCodeSVG
                value={songId}
                size={size}
                id={`qr-small-${songId}`}
                bgColor="transparent"
                fgColor="currentColor"
                level="M"
              />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              🎵 {songTitle || "Canción"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeSVG
                value={songId}
                size={modalSize}
                id={`qr-modal-${songId}`}
                bgColor="white"
                fgColor="black"
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                ID de la canción:
              </p>
              <code className="text-xs bg-muted px-3 py-2 rounded break-all">
                {songId}
              </code>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Escanea este código QR para reproducir la canción
            </p>
            <Button onClick={downloadQR} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Descargar PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
