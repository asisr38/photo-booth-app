import { useMemo, useState } from "react";
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

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

      const mime = format === "png" ? "image/png" : "image/jpeg";
      const qualityValue = format === "jpeg" ? (quality === "high" ? 0.94 : 0.88) : 1;

      canvas.toBlob(
        (blob) => {
          setIsExporting(false);
          if (!blob) {
            onStatusChange("Export failed. Please try again.");
            return;
          }
          const filename = `photo-booth-${layout.id}-${quality}.${format === "png" ? "png" : "jpg"}`;
          downloadBlob(blob, filename);
          onStatusChange(`${format.toUpperCase()} downloaded.`);
        },
        mime,
        qualityValue
      );
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
          <h2 id="exportTitle">Export</h2>
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
