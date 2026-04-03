import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { FrameOverlayKind, FrameStyle } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import { renderComposition } from "../lib/canvas/renderComposition";
import type { BoothShot } from "../store/useBoothStore";

type CustomFrameBuilderProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  editingFrame?: FrameStyle | null;
  onSave: (frame: FrameStyle) => void;
  onCancel: () => void;
};

const OVERLAY_OPTIONS: { value: FrameOverlayKind; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sparkle", label: "Sparkle" },
  { value: "bubbles", label: "Bubbles" },
  { value: "sprinkles", label: "Sprinkles" },
  { value: "hearts", label: "Hearts" },
  { value: "heart-chain", label: "Heart Chain" },
  { value: "ribbon", label: "Ribbon" },
  { value: "film-strip", label: "Film Strip" },
  { value: "cat-whiskers", label: "Cat Whiskers" },
  { value: "sticker", label: "Sticker" },
  { value: "neon", label: "Neon" },
  { value: "grid-glow", label: "Grid Glow" },
  { value: "party", label: "Party" },
  { value: "gold", label: "Gold" },
  { value: "vintage", label: "Vintage" },
];

const generateId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const defaultFrame = (): FrameStyle => ({
  id: generateId(),
  name: "My Frame",
  description: "Custom frame",
  borderWidthRatio: 0.02,
  cornerRadiusRatio: 0.06,
  backgroundColor: "#ffffff",
  borderColor: "#ff7bb0",
  overlayKind: "none",
  shadowStrength: 0.1,
});

const exportFrameAsJson = (frame: FrameStyle) => {
  const blob = new Blob([JSON.stringify(frame, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${frame.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const CustomFrameBuilder = ({
  layout,
  shots,
  editingFrame,
  onSave,
  onCancel,
}: CustomFrameBuilderProps) => {
  const [frame, setFrame] = useState<FrameStyle>(() =>
    editingFrame ? { ...editingFrame } : defaultFrame()
  );
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof FrameStyle>(key: K, value: FrameStyle[K]) => {
    setFrame((prev) => ({ ...prev, [key]: value }));
  };

  const previewSize = 280;

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width: exportW, height: exportH } = layout.exportSize;
      const maxDim = Math.max(exportW, exportH);
      const scale = maxDim > previewSize ? previewSize / maxDim : 1;
      const w = Math.max(1, Math.round(exportW * scale));
      const h = Math.max(1, Math.round(exportH * scale));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsRendering(true);
      await new Promise((r) => setTimeout(r, 30));
      if (cancelled) return;
      try {
        await renderComposition({ ctx, width: w, height: h, layout, shots, frame, captionText: frame.name, watermarkEnabled: false, captionAlign: "center" });
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [frame, layout, shots]);

  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<FrameStyle>;
      if (parsed && typeof parsed.name === "string") {
        setFrame({
          ...defaultFrame(),
          ...parsed,
          id: editingFrame?.id ?? generateId(),
        });
      }
    } catch {
      // ignore malformed imports
    }
    if (importInputRef.current) importInputRef.current.value = "";
  }, [editingFrame]);

  const handleSave = () => {
    if (!frame.name.trim()) return;
    onSave({ ...frame, id: editingFrame?.id ?? frame.id });
  };

  return (
    <div className="custom-frame-builder">
      <div className="cfb-layout">
        <div className="cfb-preview-col">
          <div className="cfb-preview-wrap">
            <canvas ref={canvasRef} className="cfb-canvas" />
            {isRendering && <span className="cfb-rendering-badge">Rendering...</span>}
          </div>
          <div className="cfb-preview-actions">
            <button
              type="button"
              className="btn ghost btn-sm"
              onClick={() => exportFrameAsJson(frame)}
              title="Export this frame as JSON"
            >
              Export JSON
            </button>
            <label className="btn ghost btn-sm cfb-import-label" title="Import frame from JSON">
              Import JSON
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                className="cfb-import-input"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>

        <div className="cfb-controls-col">
          <div className="cfb-field">
            <label className="cfb-label" htmlFor="cfb-name">Frame name</label>
            <input
              id="cfb-name"
              type="text"
              className="cfb-input"
              value={frame.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={40}
              placeholder="My Frame"
            />
          </div>

          <div className="cfb-field">
            <label className="cfb-label" htmlFor="cfb-desc">Description</label>
            <input
              id="cfb-desc"
              type="text"
              className="cfb-input"
              value={frame.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={80}
              placeholder="Short description"
            />
          </div>

          <div className="cfb-row">
            <div className="cfb-field cfb-field--color">
              <label className="cfb-label" htmlFor="cfb-bg">Background</label>
              <input
                id="cfb-bg"
                type="color"
                className="cfb-color"
                value={frame.backgroundColor}
                onChange={(e) => update("backgroundColor", e.target.value)}
              />
              <span className="cfb-color-val">{frame.backgroundColor}</span>
            </div>
            <div className="cfb-field cfb-field--color">
              <label className="cfb-label" htmlFor="cfb-border">Border</label>
              <input
                id="cfb-border"
                type="color"
                className="cfb-color"
                value={frame.borderColor}
                onChange={(e) => update("borderColor", e.target.value)}
              />
              <span className="cfb-color-val">{frame.borderColor}</span>
            </div>
          </div>

          <div className="cfb-field">
            <label className="cfb-label" htmlFor="cfb-border-width">
              Border width <span className="cfb-val">{Math.round(frame.borderWidthRatio * 1000) / 10}%</span>
            </label>
            <input
              id="cfb-border-width"
              type="range"
              className="cfb-range"
              min={5}
              max={60}
              step={1}
              value={Math.round(frame.borderWidthRatio * 1000)}
              onChange={(e) => update("borderWidthRatio", Number(e.target.value) / 1000)}
            />
          </div>

          <div className="cfb-field">
            <label className="cfb-label" htmlFor="cfb-radius">
              Corner radius <span className="cfb-val">{Math.round(frame.cornerRadiusRatio * 100)}%</span>
            </label>
            <input
              id="cfb-radius"
              type="range"
              className="cfb-range"
              min={0}
              max={20}
              step={1}
              value={Math.round(frame.cornerRadiusRatio * 100)}
              onChange={(e) => update("cornerRadiusRatio", Number(e.target.value) / 100)}
            />
          </div>

          <div className="cfb-field">
            <label className="cfb-label" htmlFor="cfb-shadow">
              Shadow <span className="cfb-val">{Math.round(frame.shadowStrength * 100)}%</span>
            </label>
            <input
              id="cfb-shadow"
              type="range"
              className="cfb-range"
              min={0}
              max={30}
              step={1}
              value={Math.round(frame.shadowStrength * 100)}
              onChange={(e) => update("shadowStrength", Number(e.target.value) / 100)}
            />
          </div>

          <div className="cfb-field">
            <label className="cfb-label" htmlFor="cfb-overlay">Overlay decoration</label>
            <select
              id="cfb-overlay"
              className="cfb-select"
              value={frame.overlayKind}
              onChange={(e) => update("overlayKind", e.target.value as FrameOverlayKind)}
            >
              {OVERLAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="cfb-footer">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={handleSave}
          disabled={!frame.name.trim()}
        >
          {editingFrame ? "Update Frame" : "Save Frame"}
        </button>
      </div>
    </div>
  );
};
