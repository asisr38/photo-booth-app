import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type CapturePayload = {
  dataUrl: string;
  width: number;
  height: number;
};

type CountdownSeconds = 0 | 3 | 5 | 10;

type PendingCapturePreview = {
  slotIndex: number;
  slotCount: number;
  dataUrl: string;
};

type CameraPreviewProps = {
  activeSlotIndex: number;
  slotCount: number;
  slotsFilled: number;
  isCaptureComplete: boolean;
  countdownSeconds: CountdownSeconds;
  onCountdownChange: (seconds: CountdownSeconds) => void;
  mirrorPreview: boolean;
  onMirrorChange: (enabled: boolean) => void;
  pendingCapture: PendingCapturePreview | null;
  onConfirmPending: () => void;
  onRetakePending: () => void;
  onCaptured: (payload: CapturePayload) => void;
  onStatusChange: (message: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
};

type CameraState = "idle" | "requesting" | "live" | "denied" | "insecure" | "error";

type CameraFilter = {
  id: string;
  label: string;
  cssFilter: string;
};

const SAFE_MAX_DIMENSION = 2400;

const countdownOptions: CountdownSeconds[] = [0, 3, 5, 10];

const cameraFilters: CameraFilter[] = [
  { id: "none", label: "Normal", cssFilter: "none" },
  { id: "soft", label: "Soft", cssFilter: "brightness(1.04) saturate(1.05)" },
  { id: "warm", label: "Warm", cssFilter: "saturate(1.12) sepia(0.18)" },
  { id: "cool", label: "Cool", cssFilter: "saturate(1.05) hue-rotate(335deg)" },
  { id: "mono", label: "Mono", cssFilter: "grayscale(1) contrast(1.06)" },
  { id: "pop", label: "Pop", cssFilter: "contrast(1.12) saturate(1.18)" },
];

const labelForCountdown = (value: CountdownSeconds): string =>
  value === 0 ? "Off" : `${value}s`;

export const CameraPreview = ({
  activeSlotIndex,
  slotCount,
  slotsFilled,
  isCaptureComplete,
  countdownSeconds,
  onCountdownChange,
  mirrorPreview,
  onMirrorChange,
  pendingCapture,
  onConfirmPending,
  onRetakePending,
  onCaptured,
  onStatusChange,
  onBack,
  showBackButton = false,
}: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedFilterId, setSelectedFilterId] = useState<string>("none");

  const stopCamera = useCallback(() => {
    if (!streamRef.current) {
      return;
    }
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("error");
      onStatusChange("Camera access is not supported on this browser.");
      return;
    }

    if (!window.isSecureContext) {
      setCameraState("insecure");
      onStatusChange("Camera needs HTTPS or localhost. Try the HTTPS dev server.");
      return;
    }

    onStatusChange("Requesting camera access...");
    setCameraState("requesting");
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        setCameraState("error");
        onStatusChange("Camera failed to initialize.");
        return;
      }

      video.srcObject = stream;
      await video.play();
      setCameraState("live");
      onStatusChange("");
    } catch (error) {
      setCameraState("denied");
      onStatusChange("Camera permission was denied. Please allow access and retry.");
    }
  }, [facingMode, onStatusChange, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current || video.readyState < 2) {
      onStatusChange("Camera is not ready yet.");
      setIsCapturing(false);
      return;
    }

    const rawWidth = video.videoWidth;
    const rawHeight = video.videoHeight;
    const maxDimension = Math.max(rawWidth, rawHeight);
    const scale = maxDimension > SAFE_MAX_DIMENSION ? SAFE_MAX_DIMENSION / maxDimension : 1;
    const width = Math.max(1, Math.round(rawWidth * scale));
    const height = Math.max(1, Math.round(rawHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onStatusChange("Capture failed. Please try again.");
      setIsCapturing(false);
      return;
    }

    const selectedFilter = cameraFilters.find((filter) => filter.id === selectedFilterId);
    const filterCss = selectedFilter?.cssFilter ?? "none";

    if (mirrorPreview && facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.filter = filterCss;
    ctx.drawImage(video, 0, 0, width, height);
    ctx.filter = "none";
    const dataUrl = canvas.toDataURL("image/png", 1);
    onCaptured({ dataUrl, width, height });
    onStatusChange("Captured. You can retake any slot.");
    setIsCapturing(false);
    setCountdownRemaining(null);
  }, [facingMode, mirrorPreview, onCaptured, onStatusChange, selectedFilterId]);

  const handleCapture = useCallback(() => {
    if (isCapturing) {
      return;
    }

    if (countdownSeconds === 0) {
      setIsCapturing(true);
      captureFrame();
      return;
    }

    setIsCapturing(true);
    setCountdownRemaining(countdownSeconds);
  }, [captureFrame, countdownSeconds, isCapturing]);

  useEffect(() => {
    if (countdownRemaining === null) {
      return;
    }

    if (countdownRemaining <= 0) {
      captureFrame();
      return;
    }

    onStatusChange(`Capturing in ${countdownRemaining}...`);
    const timer = window.setTimeout(() => {
      setCountdownRemaining((prev) => (prev === null ? prev : prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [captureFrame, countdownRemaining, onStatusChange]);

  const handleFlip = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const isLive = cameraState === "live";
  const isDenied = cameraState === "denied";
  const isInsecure = cameraState === "insecure";
  const isRequesting = cameraState === "requesting";
  const isPending = Boolean(pendingCapture);
  const isCountingDown = countdownRemaining !== null;
  const isBusy = isCapturing || isCountingDown;
  const hudShotIndex = pendingCapture ? pendingCapture.slotIndex : activeSlotIndex;
  const selectedFilter = cameraFilters.find((filter) => filter.id === selectedFilterId);
  const filterCss = selectedFilter?.cssFilter ?? "none";
  const fallbackMessage = isInsecure
    ? "Camera needs HTTPS or localhost."
    : isDenied
      ? "Camera access is blocked."
      : "Waiting for camera permission...";

  const videoStyle = useMemo(() => {
    const style: Record<string, string> = {
      filter: filterCss,
    };
    if (mirrorPreview && facingMode === "user") {
      style.transform = "scaleX(-1)";
    }
    return style;
  }, [facingMode, filterCss, mirrorPreview]);

  return (
    <section className="panel camera-panel" aria-labelledby="cameraTitle">
      <div className="panel-header">
        <div>
          <h2 id="cameraTitle">Capture</h2>
          <p>Align your subject and capture each slot.</p>
        </div>
        {showBackButton && onBack ? (
          <button
            type="button"
            className="camera-header-back camera-icon-btn"
            onClick={onBack}
            aria-label="Back to layout"
          >
            <svg
              className="camera-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
            >
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      <div className={`camera-viewport ${isLive ? "is-live" : ""} ${isPending ? "is-pending" : ""}`}>
        <video ref={videoRef} autoPlay playsInline muted style={videoStyle}></video>
        {!isLive && (
          <div className="camera-fallback" role="status">
            <p>{fallbackMessage}</p>
            {isInsecure && (
              <p>Open this page via HTTPS (for example `npm run dev:host:https`).</p>
            )}
            {!isInsecure && (
              <button type="button" className="btn primary" onClick={startCamera} disabled={isRequesting}>
                {isRequesting ? "Opening camera..." : isDenied ? "Try Again" : "Enable Camera"}
              </button>
            )}
          </div>
        )}
        <div className={`camera-hud ${isPending ? "is-pending" : ""}`}>
          <div className="camera-hud-badge">
            {pendingCapture ? `Review shot ${hudShotIndex + 1}` : `Shot ${hudShotIndex + 1} of ${slotCount}`}
          </div>
          <div className="camera-hud-subtle">
            {isCaptureComplete ? "All shots captured" : `${slotsFilled}/${slotCount} captured`}
          </div>
        </div>
        {!pendingCapture && isLive && (
          <div className="camera-overlay">
            <div className="camera-filter-strip" role="group" aria-label="Filters">
              {cameraFilters.map((filter) => {
                const isActive = filter.id === selectedFilterId;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    className={`camera-filter-chip ${isActive ? "is-active" : ""}`}
                    onClick={() => setSelectedFilterId(filter.id)}
                    aria-pressed={isActive}
                    disabled={!isLive || isBusy}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="camera-controls-overlay">
              <button
                type="button"
                className="camera-flip camera-icon-btn"
                onClick={handleFlip}
                disabled={!isLive || isBusy}
                aria-label="Flip camera"
              >
                <svg
                  className="camera-icon"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path
                    d="M7 7h7a4 4 0 0 1 4 4v1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18 6v6h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 17h-7a4 4 0 0 1-4-4v-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 18v-6h6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className={`camera-shutter ${isCapturing ? "is-busy" : ""}`}
                onClick={handleCapture}
                disabled={!isLive || isBusy}
                aria-label="Capture photo"
              >
                <span className="camera-shutter-core" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        )}
        {pendingCapture && (
          <div className="camera-confirm-overlay" role="dialog" aria-live="assertive">
            <img src={pendingCapture.dataUrl} alt={`Preview for slot ${pendingCapture.slotIndex + 1}`} />
            <div className="camera-confirm-meta">
              Slot {pendingCapture.slotIndex + 1} of {pendingCapture.slotCount}
            </div>
          </div>
        )}
        {countdownRemaining !== null && countdownRemaining > 0 && (
          <div className="camera-countdown" aria-live="assertive">
            {countdownRemaining}
          </div>
        )}
      </div>

      {pendingCapture ? (
        <div className="controls camera-confirm-actions">
          <button type="button" className="btn ghost" onClick={onRetakePending}>
            Retake
          </button>
          <button type="button" className="btn primary" onClick={onConfirmPending}>
            Use Photo
          </button>
        </div>
      ) : (
        <>
          <div className="camera-toolbar">
            <div className="countdown-group" role="group" aria-label="Countdown options">
              {countdownOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`countdown-chip ${countdownSeconds === option ? "is-active" : ""}`}
                  onClick={() => onCountdownChange(option)}
                  aria-pressed={countdownSeconds === option}
                  disabled={isPending || isBusy}
                >
                  {labelForCountdown(option)}
                </button>
              ))}
            </div>
            <label className="mirror-toggle">
              <input
                type="checkbox"
                checked={mirrorPreview}
                onChange={(event) => onMirrorChange(event.target.checked)}
                disabled={isPending || isBusy}
              />
              <span>Mirror preview</span>
            </label>
          </div>

        </>
      )}
    </section>
  );
};
