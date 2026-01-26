import { useMemo, useState } from "react";
import logoPlayful from "../assets/logo/papersnap-playful.png";
import type { FrameStyle } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import { renderComposition } from "../lib/canvas/renderComposition";
import type { BoothShot } from "../store/useBoothStore";

type ExportQuality = "standard" | "high";

type ExportPanelProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  frame: FrameStyle;
  captionText: string;
  watermarkEnabled: boolean;
  email: string;
  onEmailChange: (email: string) => void;
  onStartOver: () => void;
  onStatusChange: (message: string) => void;
};

const scaleForQuality = (quality: ExportQuality): number => (quality === "high" ? 2 : 1);

const prettySize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const estimateBytes = (width: number, height: number, format: "png" | "jpeg"): number => {
  const base = width * height * 4;
  const ratio = format === "png" ? 0.52 : 0.16;
  return Math.max(32 * 1024, Math.round(base * ratio));
};

const isValidEmail = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

type FilePickerHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
};

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
};

type SaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FilePickerHandle>;

const supportsDownloadAttribute = (): boolean => {
  const link = document.createElement("a");
  return typeof link.download !== "undefined";
};

const isLikelyIos = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent || "";
  const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
  const isIpadOs = /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
  return isAppleDevice || isIpadOs;
};

const getSaveFilePicker = (): SaveFilePicker | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  return picker ?? null;
};

const createExportBlob = async (
  canvas: HTMLCanvasElement,
  mime: string,
  qualityValue: number
): Promise<Blob | null> => {
  try {
    if (typeof canvas.toBlob === "function") {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, qualityValue)
      );
      if (blob) {
        return blob;
      }
    }
    const dataUrl = canvas.toDataURL(mime, qualityValue);
    if (typeof fetch === "function") {
      const response = await fetch(dataUrl);
      return await response.blob();
    }
    const parts = dataUrl.split(",");
    if (parts.length < 2) {
      return null;
    }
    const header = parts[0] ?? "";
    const data = parts[1] ?? "";
    const isBase64 = /;base64/i.test(header);
    const mimeMatch = header.match(/data:([^;]+)/i);
    const resolvedMime = mimeMatch ? mimeMatch[1] : mime;
    const raw = isBase64 ? atob(data) : decodeURIComponent(data);
    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) {
      buffer[i] = raw.charCodeAt(i);
    }
    return new Blob([buffer], { type: resolvedMime });
  } catch (error) {
    return null;
  }
};

const downloadWithAnchor = (blob: Blob, filename: string): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  if (!supportsDownloadAttribute() || isLikelyIos()) {
    return false;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
};

const tryShareFile = async (blob: Blob, filename: string): Promise<boolean> => {
  if (typeof navigator === "undefined") {
    return false;
  }
  if (!("share" in navigator)) {
    return false;
  }
  const file = new File([blob], filename, { type: blob.type });
  if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
    return false;
  }
  try {
    await navigator.share({ files: [file], title: filename });
    return true;
  } catch (error) {
    return false;
  }
};

export const ExportPanel = ({
  layout,
  shots,
  frame,
  captionText,
  watermarkEnabled,
  email,
  onEmailChange,
  onStartOver,
  onStatusChange,
}: ExportPanelProps) => {
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [isExporting, setIsExporting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const exportMeta = useMemo(() => {
    const scale = scaleForQuality(quality);
    const width = layout.exportSize.width * scale;
    const height = layout.exportSize.height * scale;
    return { width, height, scale };
  }, [layout.exportSize.height, layout.exportSize.width, quality]);

  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const emailError = emailTouched && !emailValid;
  const downloadsLocked = !emailValid;

  const handleDownload = async (format: "png" | "jpeg") => {
    if (isExporting) {
      return;
    }
    if (!emailValid) {
      setEmailTouched(true);
      onStatusChange("Enter a valid email to unlock free downloads.");
      return;
    }
    setIsExporting(true);
    onStatusChange(`Rendering ${format.toUpperCase()}...`);

    const filename = `photo-booth-${layout.id}-${quality}.${format === "png" ? "png" : "jpg"}`;
    const mime = format === "png" ? "image/png" : "image/jpeg";
    const extension = format === "png" ? ".png" : ".jpg";
    const picker = getSaveFilePicker();
    let fileHandle: FilePickerHandle | null = null;

    if (picker && !isLikelyIos()) {
      try {
        fileHandle = await picker({
          suggestedName: filename,
          types: [
            {
              description: format === "png" ? "PNG image" : "JPEG image",
              accept: {
                [mime]: [extension],
              },
            },
          ],
        });
      } catch (error) {
        setIsExporting(false);
        return;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = exportMeta.width;
    canvas.height = exportMeta.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExporting(false);
      onStatusChange("Export failed. Please try again.");
      return;
    }

    try {
      await renderComposition({
        ctx,
        width: exportMeta.width,
        height: exportMeta.height,
        layout,
        shots,
        frame,
        captionText,
        watermarkEnabled,
      });

      const qualityValue = format === "jpeg" ? (quality === "high" ? 0.94 : 0.88) : 1;
      const blob = await createExportBlob(canvas, mime, qualityValue);
      if (!blob) {
        setIsExporting(false);
        onStatusChange("Export failed. Please try again.");
        return;
      }

      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setIsExporting(false);
        onStatusChange("Saved to your device.");
        return;
      }

      if (isLikelyIos()) {
        const shared = await tryShareFile(blob, filename);
        setIsExporting(false);
        if (shared) {
          onStatusChange("Share sheet opened.");
          return;
        }
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        onStatusChange("Image opened. Long-press to save.");
        return;
      }

      const didDownload = downloadWithAnchor(blob, filename);
      setIsExporting(false);
      if (didDownload) {
        onStatusChange(`${format.toUpperCase()} downloaded.`);
        return;
      }

      const shared = await tryShareFile(blob, filename);
      if (shared) {
        onStatusChange("Share sheet opened.");
        return;
      }

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      onStatusChange("Image opened. Save or share from the new tab.");
    } catch (error) {
      setIsExporting(false);
      onStatusChange("Export failed. Please try again.");
    }
  };

  const pngEstimate = estimateBytes(exportMeta.width, exportMeta.height, "png");
  const jpgEstimate = estimateBytes(exportMeta.width, exportMeta.height, "jpeg");

  return (
    <section className="panel export-panel" aria-labelledby="exportTitle">
      <div className="panel-header export-header">
        <div>
          <div className="export-title-row">
            <img src={logoPlayful} alt="" className="export-title-mark" aria-hidden="true" />
            <h2 id="exportTitle">Export</h2>
          </div>
          <p>Download a polished output ready to print.</p>
        </div>
        <button type="button" className="btn ghost" onClick={onStartOver}>
          Start Over
        </button>
      </div>

      <div className="export-meta">
        <div className="quality-toggle" role="group" aria-label="Export quality">
          <button
            type="button"
            className={`quality-chip ${quality === "standard" ? "is-active" : ""}`}
            onClick={() => setQuality("standard")}
            aria-pressed={quality === "standard"}
          >
            Standard
          </button>
          <button
            type="button"
            className={`quality-chip ${quality === "high" ? "is-active" : ""}`}
            onClick={() => setQuality("high")}
            aria-pressed={quality === "high"}
          >
            High quality
          </button>
        </div>

        <div className="export-size">
          <div className="export-size-row">
            <span>Final size</span>
            <strong>
              {exportMeta.width}x{exportMeta.height}px
            </strong>
          </div>
          <div className="export-size-row export-size-subtle">
            <span>Approx file size</span>
            <strong>
              PNG {prettySize(pngEstimate)} / JPG {prettySize(jpgEstimate)}
            </strong>
          </div>
        </div>
      </div>

      <div className={`email-gate ${emailError ? "is-error" : ""}`}>
        <label className="email-field" htmlFor="emailInput">
          <span className="form-label">Email for free download</span>
          <input
            id="emailInput"
            className="email-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={emailError}
            aria-describedby="emailHint"
            required
          />
        </label>
        <p id="emailHint" className={`email-hint ${emailError ? "is-error" : ""}`}>
          {emailError
            ? "Please enter a valid email to continue."
            : "We only use this to unlock your free download."}
        </p>
      </div>

      <div className="export-actions">
        <button
          type="button"
          className="btn primary"
          onClick={() => handleDownload("png")}
          disabled={downloadsLocked || isExporting}
        >
          {isExporting ? "Rendering..." : "Download PNG"}
        </button>
        <button
          type="button"
          className="btn ghost"
          onClick={() => handleDownload("jpeg")}
          disabled={downloadsLocked || isExporting}
        >
          Download JPG
        </button>
      </div>
    </section>
  );
};
