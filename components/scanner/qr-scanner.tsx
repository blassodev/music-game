"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flashlight, QrCode, Scan } from "lucide-react";
import pb from "@/lib/pocketbase";
import { SongsRecord } from "@/lib/types/pocketbase";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Error clearing scanner:", error);
        }
      }
    };
  }, []);

  const handleScannerError = (err: unknown) => {
    console.error("Scanner error:", err);
    let errorMsg = t("errors.cameraStart");

    if (err instanceof Error) {
      errorMsg = err.message;
    } else if (typeof err === "string") {
      errorMsg = err;
    }

    setError(errorMsg);
    setIsScanning(false);
    setIsInitializing(false);
    toast.error(errorMsg);
  };

  const initializeScanner = async () => {
    // Check if the qr-reader element exists
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

    // Request camera permissions explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
    } catch (permissionError) {
      if (permissionError instanceof DOMException) {
        if (permissionError.name === "NotAllowedError") {
          throw new Error(t("errors.permissionDenied"));
        } else if (permissionError.name === "NotFoundError") {
          throw new Error(t("errors.noCamera"));
        } else if (permissionError.name === "NotReadableError") {
          throw new Error(t("errors.cameraInUse"));
        }
      }
      throw new Error(t("errors.cameraAccess"));
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

    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    // Get available cameras
    let devices;
    try {
      devices = await Html5Qrcode.getCameras();
    } catch {
      throw new Error(t("errors.enumerateCameras"));
    }

    if (!devices || devices.length === 0) {
      throw new Error(t("errors.noCamerasFound"));
    }

    console.log("Available cameras:", devices);

    // Prefer back camera, fallback to any available camera
    const backCamera = devices.find(
      (device) =>
        device.label.toLowerCase().includes("back") ||
        device.label.toLowerCase().includes("environment")
    );
    const cameraId = backCamera?.id || devices[0].id;

    console.log(
      "Using camera:",
      cameraId,
      backCamera?.label || devices[0].label
    );
    setCameraInfo(`Using: ${backCamera?.label || devices[0].label}`);

    // Start scanning with improved configuration
    await scanner.start(
      cameraId,
      {
        fps: 10,
        qrbox: function (viewfinderWidth, viewfinderHeight) {
          // Make qrbox responsive to container size with better mobile scaling
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const isMobile = window.innerWidth < 768; // Mobile detection

          // Use a larger percentage for mobile to make the scanning area more generous
          const scaleFactor = isMobile ? 0.85 : 0.7;
          const qrboxSize = Math.floor(minEdge * scaleFactor);

          // Ensure minimum size for usability
          const minSize = isMobile ? 200 : 150;
          const finalSize = Math.max(qrboxSize, minSize);

          return {
            width: finalSize,
            height: finalSize,
          };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment", // Use back camera
          width: { ideal: 1280, min: 480, max: 1920 },
          height: { ideal: 720, min: 480, max: 1080 },
        },
      },
      async (decodedText) => {
        console.log("QR Code detected:", decodedText);
        const isValid = await validateCardCode(decodedText);
        if (isValid) {
          toast.success(t("messages.scanSuccess"));
          scanner
            .stop()
            .then(() => {
              router.push(`/player/${decodedText}`);
            })
            .catch(console.error);
        } else {
          toast.error(t("messages.invalidCard") + ": " + decodedText);
        }
      },
      (errorMessage) => {
        // Only log scanning errors, don't show to user
        console.log("QR scanning error:", errorMessage);
      }
    );

    // Try to get flash capabilities
    try {
      const capabilities = await scanner.getRunningTrackCameraCapabilities();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHasFlash(!!(capabilities as any).torch);
    } catch {
      setHasFlash(false);
    }

    setIsInitializing(false);

    // Apply custom styles to video element for better sizing
    setTimeout(() => {
      const qrReaderElement = document.getElementById("qr-reader");
      if (qrReaderElement) {
        const video = qrReaderElement.querySelector("video");
        const canvas = qrReaderElement.querySelector("canvas");

        if (video) {
          video.style.width = "100%";
          video.style.height = "100%";
          video.style.maxWidth = "100%";
          video.style.objectFit = "cover";
          video.style.objectPosition = "center";
        }

        if (canvas) {
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.style.maxWidth = "100%";
          canvas.style.position = "absolute";
          canvas.style.top = "0";
          canvas.style.left = "0";
        }

        // Make sure the container has proper positioning
        qrReaderElement.style.position = "relative";
        qrReaderElement.style.overflow = "hidden";
      }
    }, 500);

    toast.success(t("messages.cameraStarted"));
  };

  const startScanning = async () => {
    try {
      setError(null);
      setIsInitializing(true);
      setIsScanning(true);

      // Use setTimeout to ensure DOM is rendered
      setTimeout(async () => {
        try {
          await initializeScanner();
        } catch (err) {
          handleScannerError(err);
        }
      }, 100);
    } catch (err) {
      handleScannerError(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        setIsScanning(false);
        setIsFlashOn(false);
        setCameraInfo("");
        toast.success(t("messages.cameraStopped"));
      } catch (err) {
        console.error("Error stopping scanner:", err);
        setIsScanning(false);
        setIsFlashOn(false);
        setCameraInfo("");
      }
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
        toast.error(t("errors.flashToggle"));
      }
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
        t("messages.cameraPermissionsOk", { count: videoDevices.length })
      );
      setCameraInfo(
        t("messages.camerasAvailable", { count: videoDevices.length })
      );
    } catch (err) {
      let errorMsg = t("errors.permissionCheckFailed");

      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            errorMsg = t("errors.permissionDeniedSettings");
            break;
          case "NotFoundError":
            errorMsg = t("errors.noCamera");
            break;
          case "NotReadableError":
            errorMsg = t("errors.cameraInUse");
            break;
          case "OverconstrainedError":
            errorMsg = t("errors.constraintsNotSupported");
            break;
          default:
            errorMsg = t("errors.cameraError", { message: err.message });
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const simulateScan = () => {
    const testCode = "CARD-ROCK-001-A1B2";
    toast.success(t("messages.testScanSuccess"));
    router.push(`/player/${testCode}`);
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
              </div>
            </div>
          )}

          {isInitializing && (
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {t("messages.initializing")}
              </p>
            </div>
          )}

          {/* Always render the qr-reader element, but hide it when not scanning */}
          <div
            id="qr-reader"
            className={`relative overflow-hidden rounded-lg border-4 border-primary w-full ${
              isScanning && !isInitializing ? "block" : "hidden"
            }`}
            style={{
              height: "450px",
              maxWidth: "100%",
              width: "100%",
            }}
          >
            {/* El contenido del scanner se renderiza aquí por html5-qrcode */}
          </div>

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
