"use client";

import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeDisplayProps {
  cardCode: string;
  size?: number;
  showActions?: boolean;
}

export function QRCodeDisplay({ cardCode, size = 128, showActions = false }: QRCodeDisplayProps) {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${cardCode}`);
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
        a.download = `${cardCode}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (showActions) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className="hover:opacity-80 transition-opacity">
            <QRCodeSVG value={cardCode} size={size} id={`qr-${cardCode}`} />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code: {cardCode}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <QRCodeSVG value={cardCode} size={256} id={`qr-large-${cardCode}`} />
            <code className="text-xs bg-muted px-3 py-2 rounded">{cardCode}</code>
            <Button onClick={downloadQR} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="p-0 h-auto">
          <QRCodeSVG value={cardCode} size={size} id={`qr-${cardCode}`} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <QRCodeSVG value={cardCode} size={256} id={`qr-modal-${cardCode}`} />
          <code className="text-xs bg-muted px-3 py-2 rounded break-all">{cardCode}</code>
          <Button onClick={downloadQR} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download as PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
