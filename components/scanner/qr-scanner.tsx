"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flashlight, QrCode, Scan } from "lucide-react";
import { validateCardCode } from "@/lib/mock-data";
import { toast } from "sonner";

export function QRScanner() {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      const backCamera = devices.find((device) =>
        device.label.toLowerCase().includes("back")
      );
      const cameraId = backCamera?.id || devices[0].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (validateCardCode(decodedText)) {
            toast.success("Card scanned successfully!");
            scanner.stop();
            router.push(`/player/${decodedText}`);
          } else {
            toast.error("Invalid card code");
          }
        },
        () => {}
      );

      try {
        const capabilities = await scanner.getRunningTrackCameraCapabilities();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHasFlash(!!(capabilities as any).torch);
      } catch {
        setHasFlash(false);
      }
      setIsScanning(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to start camera";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop();
      setIsScanning(false);
      setIsFlashOn(false);
    }
  };

  const toggleFlash = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        const track = scannerRef.current.getRunningTrackCameraCapabilities();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((track as any).torch) {
          await scannerRef.current.applyVideoConstraints(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { advanced: [{ torch: !isFlashOn }] } as any
          );
          setIsFlashOn(!isFlashOn);
        }
      } catch {
        toast.error("Failed to toggle flash");
      }
    }
  };

  const simulateScan = () => {
    const testCode = "CARD-ROCK-001-A1B2";
    toast.success("Test scan successful!");
    router.push(`/player/${testCode}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="space-y-4 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Scan Music Card</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Point your camera at the QR code on the card
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isScanning && (
            <div className="space-y-3">
              <Button
                onClick={startScanning}
                className="w-full h-12 text-base"
                size="lg"
              >
                <Scan className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
              <Button
                onClick={simulateScan}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                Test with Sample Card
              </Button>
            </div>
          )}

          {isScanning && (
            <>
              <div
                id="qr-reader"
                className="overflow-hidden rounded-lg border-4 border-primary"
              />
              <div className="flex gap-2">
                {hasFlash && (
                  <Button
                    onClick={toggleFlash}
                    variant={isFlashOn ? "default" : "outline"}
                    className="flex-1 h-12"
                    size="lg"
                  >
                    <Flashlight className="mr-2 h-5 w-5" />
                    {isFlashOn ? "Flash On" : "Flash Off"}
                  </Button>
                )}
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="flex-1 h-12"
                  size="lg"
                >
                  Stop Scanning
                </Button>
              </div>
            </>
          )}

          <div className="rounded-lg bg-muted p-4 text-xs text-muted-foreground">
            <p className="font-medium">Tips for best results:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Hold card steady in good lighting</li>
              <li>Keep QR code within the frame</li>
              <li>Avoid glare and shadows</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
