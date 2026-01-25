import { useEffect, useMemo, useRef, useState } from "react";
import type { FrameStyle } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import { renderComposition } from "../lib/canvas/renderComposition";
import type { BoothShot } from "../store/useBoothStore";

type CompositionCanvasPreviewProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  frame: FrameStyle;
  captionText: string;
  watermarkEnabled: boolean;
  maxPreviewSize?: number;
};

export const CompositionCanvasPreview = ({
  layout,
  shots,
  frame,
  captionText,
  watermarkEnabled,
  maxPreviewSize = 440,
}: CompositionCanvasPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const previewSize = useMemo(() => {
    const { width, height } = layout.exportSize;
    const maxDim = Math.max(width, height);
    const scale = maxDim > maxPreviewSize ? maxPreviewSize / maxDim : 1;
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
      scale,
    };
  }, [layout.exportSize, maxPreviewSize]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      canvas.width = previewSize.width;
      canvas.height = previewSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      setIsRendering(true);
      // Debounce slightly to avoid thrashing during rapid state updates.
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      if (cancelled) {
        return;
      }

      try {
        await renderComposition({
          ctx,
          width: previewSize.width,
          height: previewSize.height,
          layout,
          shots,
          frame,
          captionText,
          watermarkEnabled,
        });
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [captionText, frame, layout, previewSize.height, previewSize.width, shots, watermarkEnabled]);

  return (
    <div className="panel preview-panel" aria-live="polite">
      <div className="panel-header">
        <div>
          <h2>Preview</h2>
          <p>Live render of your final composition.</p>
        </div>
        {isRendering && <span className="preview-badge">Rendering...</span>}
      </div>
      <div className="preview-canvas-wrap" role="img" aria-label="Composition preview">
        <canvas ref={canvasRef} className="preview-canvas" />
      </div>
    </div>
  );
};
