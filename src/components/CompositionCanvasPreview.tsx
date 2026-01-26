import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { FrameStyle } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import { renderComposition } from "../lib/canvas/renderComposition";
import type { BoothShot } from "../store/useBoothStore";

type SwipeDirection = "next" | "prev";

type CompositionCanvasPreviewProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  frame: FrameStyle;
  frames?: FrameStyle[];
  selectedFrameId?: string;
  captionText: string;
  watermarkEnabled: boolean;
  onSwipeFrame?: (direction: SwipeDirection) => void;
  maxPreviewSize?: number;
};

type PointerState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
};

const SWIPE_THRESHOLD_PX = 52;
const SWIPE_DIRECTION_BIAS = 1.2;

export const CompositionCanvasPreview = ({
  layout,
  shots,
  frame,
  frames,
  selectedFrameId,
  captionText,
  watermarkEnabled,
  onSwipeFrame,
  maxPreviewSize = 440,
}: CompositionCanvasPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerStateRef = useRef<PointerState | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const frameList = useMemo(() => {
    if (frames && frames.length > 0) {
      return frames;
    }
    return [frame];
  }, [frame, frames]);

  const resolvedFrameId = selectedFrameId ?? frame.id;

  const frameIndex = useMemo(() => {
    const index = frameList.findIndex((item) => item.id === resolvedFrameId);
    return index < 0 ? 0 : index;
  }, [frameList, resolvedFrameId]);

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

  const resetSwipe = useCallback((target: HTMLDivElement | null, pointerId?: number) => {
    if (target && pointerId !== undefined && target.hasPointerCapture?.(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
    pointerStateRef.current = null;
    setIsSwipeActive(false);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!onSwipeFrame) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      pointerStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      setIsSwipeActive(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [onSwipeFrame]
  );

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerStateRef.current;
    if (!state || state.pointerId !== event.pointerId) {
      return;
    }
    state.lastX = event.clientX;
    state.lastY = event.clientY;
  }, []);

  const handlePointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = pointerStateRef.current;
      if (!state || state.pointerId !== event.pointerId) {
        return;
      }
      resetSwipe(event.currentTarget, event.pointerId);
    },
    [resetSwipe]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const state = pointerStateRef.current;
      if (!state || state.pointerId !== event.pointerId) {
        return;
      }

      const dx = state.lastX - state.startX;
      const dy = state.lastY - state.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (
        onSwipeFrame &&
        absDx >= SWIPE_THRESHOLD_PX &&
        absDx > absDy * SWIPE_DIRECTION_BIAS
      ) {
        onSwipeFrame(dx < 0 ? "next" : "prev");
      }

      resetSwipe(event.currentTarget, event.pointerId);
    },
    [onSwipeFrame, resetSwipe]
  );

  return (
    <div className="panel preview-panel" aria-live="polite">
      <div className="panel-header">
        <div>
          <h2>Preview</h2>
          <p>Live render of your final composition.</p>
        </div>
        {isRendering && <span className="preview-badge">Rendering...</span>}
      </div>
      <div
        className="preview-canvas-wrap"
        role="group"
        aria-label={`Composition preview. Current frame: ${frame.name}.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <canvas ref={canvasRef} className="preview-canvas" />
        {onSwipeFrame && frameList.length > 1 ? (
          <div className={`preview-swipe-hint ${isSwipeActive ? "is-active" : ""}`} aria-hidden="true">
            <span className="preview-swipe-arrow" aria-hidden="true">
              ‹
            </span>
            <span className="preview-swipe-text">
              {frameList[frameIndex]?.name ?? frame.name}
            </span>
            <span className="preview-swipe-arrow" aria-hidden="true">
              ›
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
