"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flashlight, QrCode, Scan } from "lucide-react";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { parseHitsterCode } from "@/lib/hitster/parse";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Stable toast ids: sonner replaces a toast with the same id instead of
// stacking a new one, so bursts of decoded frames can never flood the screen.
const RESULT_TOAST_ID = "qr-scan-result";
const ERROR_TOAST_ID = "qr-scanner-error";

// Re-warn cooldown for the same invalid code: while a user keeps pointing at
// an invalid card the toast refreshes at most once per interval.
const INVALID_REWARN_MS = 5000;

async function validateCardCode(cardCode: string): Promise<boolean> {
  try {
    // En el nuevo sistema, el código QR debería ser el ID de una canción
    const song = await pb.collection("songs").getOne<SongsRecord>(cardCode);
    return !!song;
  } catch (_error) {
    return false;
  }
}

export function QRScanner() {
  const router = useRouter();
  const t = useTranslations("scanner");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement | null>(null);
  // html5-qrcode fires the success callback on every decoded frame (~15/s)
  // until the camera is fully stopped. These guards make sure a single scan is
  // processed once, avoiding a flood of toasts / duplicate navigations.
  const handledRef = useRef(false);
  const processingRef = useRef(false);
  const lastInvalidRef = useRef<{ code: string; at: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraInfo, setCameraInfo] = useState<string>("");
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Check if we're in a secure context
    if (typeof window !== "undefined") {
      setIsSecureContext(window.isSecureContext);
    }

    return () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(console.error);
      } else {
        try {
          scanner.clear();
        } catch (error) {
          console.error("Error clearing scanner:", error);
        }
      }
    };
  }, []);

  /** Translate raw camera/getUserMedia failures into friendly messages. */
  const mapCameraError = (err: unknown): string => {
    if (err instanceof DOMException) {
      switch (err.name) {
        case "NotAllowedError":
          return t("errors.permissionDenied");
        case "NotFoundError":
          return t("errors.noCamera");
        case "NotReadableError":
          return t("errors.cameraInUse");
        case "OverconstrainedError":
          return t("errors.constraintsNotSupported");
      }
      return err.message || t("errors.cameraAccess");
    }

    // html5-qrcode wraps getUserMedia failures into a plain string like
    // "Error getting userMedia, error = NotAllowedError: Permission denied"
    const text =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    if (/NotAllowedError|Permission denied/i.test(text)) {
      return t("errors.permissionDenied");
    }
    if (/NotFoundError|Requested device not found/i.test(text)) {
      return t("errors.noCamera");
    }
    if (/NotReadableError|already in use/i.test(text)) {
      return t("errors.cameraInUse");
    }
    if (/OverconstrainedError/i.test(text)) {
      return t("errors.constraintsNotSupported");
    }
    return text || t("errors.cameraStart");
  };

  const handleScannerError = (err: unknown) => {
    console.error("Scanner error:", err);
    const errorMsg = mapCameraError(err);
    setError(errorMsg);
    setIsScanning(false);
    setIsInitializing(false);
    setCameraInfo("");
    toast.error(errorMsg, { id: ERROR_TOAST_ID });
  };

  /** Stop the camera without user-facing toasts (state is visible in the UI). */
  const stopScannerQuietly = async () => {
    const scanner = scannerRef.current;
    setIsFlashOn(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch (e) {
      console.warn("Error stopping scanner:", e);
    }
  };

  /** Single entry point for a successfully decoded QR payload. */
  const handleDecodedText = async (decodedText: string) => {
    // Ignore every frame once a code has been handled (see guards above).
    if (handledRef.current) return;

    // Hitster physical cards resolve on the fly via Deezer (no DB entry):
    // http://www.hitstergame.com/{lang}/{sku}/{card}
    const hitster = parseHitsterCode(decodedText);
    if (hitster) {
      handledRef.current = true;
      toast.success(t("messages.scanSuccess"), { id: RESULT_TOAST_ID });
      await stopScannerQuietly();
      setIsScanning(false);
      setCameraInfo("");
      router.push(`/hitster/${hitster.sku}/${hitster.card}`);
      return;
    }

    // Serialize the async PocketBase validation so concurrent frames don't
    // each fire their own request + toast.
    if (processingRef.current) return;
    processingRef.current = true;
    let isValid = false;
    try {
      isValid = await validateCardCode(decodedText);
    } finally {
      processingRef.current = false;
    }
    if (handledRef.current) return;

    if (isValid) {
      handledRef.current = true;
      toast.success(t("messages.scanSuccess"), { id: RESULT_TOAST_ID });
      await stopScannerQuietly();
      setIsScanning(false);
      setCameraInfo("");
      router.push(`/player/${decodedText}`);
      return;
    }

    // Invalid code: warn once per code, re-warning at most every
    // INVALID_REWARN_MS while the same code stays in view. The shared toast
    // id guarantees the warning replaces (never stacks with) other toasts.
    const now = Date.now();
    const last = lastInvalidRef.current;
    const isRepeat =
      last?.code === decodedText && now - last.at < INVALID_REWARN_MS;
    if (!isRepeat) {
      lastInvalidRef.current = { code: decodedText, at: now };
      toast.error(`${t("messages.invalidCard")}: ${decodedText}`, {
        id: RESULT_TOAST_ID,
      });
    }
  };

  const initializeScanner = async () => {
    // Check if the qr-reader element exists (it is rendered while scanning)
    const qrReaderElement = document.getElementById("qr-reader");
    if (!qrReaderElement) {
      throw new Error(t("errors.elementNotFound"));
    }

    // Check if we're running on HTTPS or localhost
    if (
      typeof window !== "undefined" &&
      window.location.protocol !== "https:" &&
      !window.location.hostname.includes("localhost") &&
      window.location.hostname !== "127.0.0.1"
    ) {
      throw new Error(t("errors.httpsRequired"));
    }

    // Clean up any existing scanner instance
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Error cleaning up previous scanner:", e);
      }
    }

    const scanner = new Html5Qrcode("qr-reader", {
      // Decode QR only: by default the ZXing fallback tries ~15 barcode
      // formats per frame, which slows detection down significantly.
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      // Prefer the browser-native BarcodeDetector (much faster) when
      // available; html5-qrcode falls back to ZXing automatically.
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });
    scannerRef.current = scanner;

    // Fresh scan session: clear the single-scan guards.
    handledRef.current = false;
    processingRef.current = false;
    lastInvalidRef.current = null;

    // One single camera open: no getUserMedia pre-check, no getCameras()
    // enumeration — facingMode selects the back camera directly.
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Centered square covering 80% of the short edge. Never force an
          // absolute minimum here: a qrbox taller than the viewfinder makes
          // html5-qrcode skip the scan-region shading entirely.
          const size = Math.floor(
            Math.min(viewfinderWidth, viewfinderHeight) * 0.8
          );
          // Publish the real scan-box size so the decorative scan line stays
          // aligned with the region actually being decoded.
          scanAreaRef.current?.style.setProperty("--qr-box", `${size}px`);
          return { width: size, height: size };
        },
        disableFlip: false,
        // `ideal` constraints never throw: devices that cannot deliver a
        // square stream simply fall back to their default aspect ratio,
        // and the container below adapts to the resulting video height.
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 1 },
        },
      },
      handleDecodedText,
      () => {
        // Frames without a decodable code arrive here ~15 times per second;
        // intentionally ignored.
      }
    );

    // Flash (torch) support and camera label
    try {
      const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
      setHasFlash(torch.isSupported());
      setIsFlashOn(!!torch.value());
    } catch {
      setHasFlash(false);
      setIsFlashOn(false);
    }
    try {
      // MediaTrackSettings includes `label` at runtime (Chrome/Firefox)
      // but the TS DOM lib does not declare it.
      const settings = scanner.getRunningTrackSettings() as MediaTrackSettings & {
        label?: string;
      };
      setCameraInfo(settings.label || "");
    } catch {
      setCameraInfo("");
    }

    setIsInitializing(false);
  };

  const startScanning = async () => {
    setError(null);
    setIsInitializing(true);
    setIsScanning(true);

    // Let React render the (now visible) scan area first: html5-qrcode
    // measures the container's clientWidth when start() runs. If it is still
    // display:none the video renders at a 300px fallback and the scan region
    // ends up misaligned with the stretched video.
    setTimeout(async () => {
      try {
        await initializeScanner();
      } catch (err) {
        handleScannerError(err);
      }
    }, 100);
  };

  const stopScanning = async () => {
    await stopScannerQuietly();
    setIsScanning(false);
    setIsInitializing(false);
    setCameraInfo("");
  };

  const toggleFlash = async () => {
    const scanner = scannerRef.current;
    if (!scanner?.isScanning) return;
    try {
      const torch = scanner.getRunningTrackCameraCapabilities().torchFeature();
      if (!torch.isSupported()) {
        setHasFlash(false);
        return;
      }
      const next = !isFlashOn;
      await torch.apply(next);
      setIsFlashOn(next);
    } catch {
      toast.error(t("errors.flashToggle"), { id: ERROR_TOAST_ID });
    }
  };

  const checkCameraPermissions = async () => {
    try {
      setError(null);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices.length === 0) {
        throw new Error(t("errors.noCamerasFound"));
      }

      // Try to access camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }, // Prefer back camera
        },
      });

      // Success - stop the stream
      stream.getTracks().forEach((track) => track.stop());

      toast.success(
        t("messages.cameraPermissionsOk", { count: videoDevices.length }),
        { id: ERROR_TOAST_ID }
      );
      setCameraInfo(
        t("messages.camerasAvailable", { count: videoDevices.length })
      );
    } catch (err) {
      const errorMsg = mapCameraError(err);
      setError(errorMsg);
      toast.error(errorMsg, { id: ERROR_TOAST_ID });
    }
  };

  const simulateScan = () => {
    const testCode = "CARD-ROCK-001-A1B2";
    toast.success(t("messages.testScanSuccess"), { id: RESULT_TOAST_ID });
    router.push(`/player/${testCode}`);
  };

  const simulateHitsterScan = () => {
    toast.success(t("messages.testScanSuccess"), { id: RESULT_TOAST_ID });
    router.push("/hitster/aaaa0064/00281");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg md:max-w-xl overflow-hidden">
        <div className="space-y-4 p-4 md:p-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Debug information */}
          {!isSecureContext && (
            <Alert>
              <AlertDescription>{t("warnings.notSecure")}</AlertDescription>
            </Alert>
          )}

          {cameraInfo && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              {cameraInfo}
            </div>
          )}

          {!isScanning && !isInitializing && (
            <div className="space-y-3">
              <Button
                onClick={startScanning}
                className="w-full h-12 text-base"
                size="lg"
              >
                <Scan className="mr-2 h-5 w-5" />
                {t("buttons.startScanning")}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={checkCameraPermissions}
                  variant="outline"
                  className="h-10 text-sm"
                >
                  {t("buttons.checkCamera")}
                </Button>
                <Button
                  onClick={simulateScan}
                  variant="outline"
                  className="h-10 text-sm"
                >
                  {t("buttons.testSample")}
                </Button>
                <Button
                  onClick={simulateHitsterScan}
                  variant="outline"
                  className="col-span-2 h-10 text-sm"
                >
                  {t("buttons.testHitster")}
                </Button>
              </div>
            </div>
          )}

          {/* Scan area: rendered only while scanning and always visible
              (never display:none) so html5-qrcode measures the real width.
              Height is driven by the video itself — no fixed 450px box. */}
          {isScanning && (
            <div
              ref={scanAreaRef}
              className={`qr-scan-area relative w-full overflow-hidden rounded-xl bg-black ${
                isInitializing ? "min-h-64" : ""
              }`}
            >
              <div id="qr-reader" className="w-full" />

              {isInitializing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
                  <p className="text-sm text-white/90">
                    {t("messages.initializing")}
                  </p>
                </div>
              ) : (
                <div className="qr-scanline-box" aria-hidden="true">
                  <div className="qr-scanline" />
                </div>
              )}
            </div>
          )}

          {isScanning && !isInitializing && (
            <div className="flex gap-2">
              {hasFlash && (
                <Button
                  onClick={toggleFlash}
                  variant={isFlashOn ? "default" : "outline"}
                  className="flex-1 h-12"
                  size="lg"
                >
                  <Flashlight className="mr-2 h-5 w-5" />
                  {isFlashOn ? t("buttons.flashOn") : t("buttons.flashOff")}
                </Button>
              )}
              <Button
                onClick={stopScanning}
                variant="destructive"
                className="flex-1 h-12"
                size="lg"
              >
                {t("buttons.stopScanning")}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
