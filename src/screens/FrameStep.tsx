import { useState } from "react";
import { CompositionCanvasPreview } from "../components/CompositionCanvasPreview";
import { CustomFrameBuilder } from "../components/CustomFrameBuilder";
import { FramePicker } from "../components/FramePicker";
import { FUJI_FRAME_ID, getFrameById } from "../lib/frames";
import type { FrameStyle } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import type { BoothShot } from "../store/useBoothStore";

type FrameStepProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  selectedFrameId: string;
  allFrames: FrameStyle[];
  captionText: string;
  captionAlign: "left" | "center" | "right";
  watermarkEnabled: boolean;
  customFrames: FrameStyle[];
  onSelectFrame: (frameId: string) => void;
  onSetCaption: (captionText: string) => void;
  onSetCaptionAlign: (align: "left" | "center" | "right") => void;
  onSetWatermark: (enabled: boolean) => void;
  onAddCustomFrame: (frame: FrameStyle) => void;
  onRemoveCustomFrame: (frameId: string) => void;
  onUpdateCustomFrame: (frame: FrameStyle) => void;
  onNext: () => void;
  onBack: () => void;
  onStatusChange: (message: string) => void;
};

const CAPTION_LIMIT = 60;

export const FrameStep = ({
  layout,
  shots,
  selectedFrameId,
  allFrames,
  captionText,
  captionAlign,
  watermarkEnabled,
  customFrames,
  onSelectFrame,
  onSetCaption,
  onSetCaptionAlign,
  onSetWatermark,
  onAddCustomFrame,
  onRemoveCustomFrame,
  onUpdateCustomFrame,
  onNext,
  onBack,
  onStatusChange,
}: FrameStepProps) => {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<FrameStyle | null>(null);

  const frame =
    allFrames.find((f) => f.id === selectedFrameId) ?? getFrameById(selectedFrameId);
  const isNextEnabled = shots.length >= layout.slotCount;
  const frameCount = allFrames.length;
  const currentFrameIndex = Math.max(
    0,
    allFrames.findIndex((item) => item.id === selectedFrameId)
  );

  const handleFrameSelect = (frameId: string) => {
    onSelectFrame(frameId);
    const frameName = allFrames.find((item) => item.id === frameId)?.name ?? "Frame";
    if (frameId === FUJI_FRAME_ID) {
      onStatusChange("Fuji Instant selected. Jumping to print preview.");
      onNext();
      return;
    }
    onStatusChange(
      frameId === selectedFrameId
        ? `${frameName} frame selected.`
        : `${frameName} selected. Adjust and continue when ready.`
    );
  };

  const handleCaptionChange = (value: string) => {
    onSetCaption(value.slice(0, CAPTION_LIMIT));
  };

  const handleFrameSwipe = (direction: "next" | "prev") => {
    if (frameCount <= 1) return;
    const delta = direction === "next" ? 1 : -1;
    const nextIndex = (currentFrameIndex + delta + frameCount) % frameCount;
    const nextFrame = allFrames[nextIndex];
    if (!nextFrame || nextFrame.id === selectedFrameId) return;
    handleFrameSelect(nextFrame.id);
  };

  const handleSaveCustomFrame = (frame: FrameStyle) => {
    if (editingFrame) {
      onUpdateCustomFrame(frame);
      onStatusChange(`"${frame.name}" updated.`);
    } else {
      onAddCustomFrame(frame);
      onSelectFrame(frame.id);
      onStatusChange(`"${frame.name}" saved and selected.`);
    }
    setBuilderOpen(false);
    setEditingFrame(null);
  };

  const handleEditCustomFrame = (frame: FrameStyle) => {
    setEditingFrame(frame);
    setBuilderOpen(true);
  };

  const handleDeleteCustomFrame = (frameId: string) => {
    onRemoveCustomFrame(frameId);
    onStatusChange("Custom frame removed.");
  };

  const handleOpenBuilder = () => {
    setEditingFrame(null);
    setBuilderOpen(true);
  };

  if (builderOpen) {
    return (
      <div className="step step-frame" role="tabpanel" aria-labelledby="step-frame">
        <div className="panel cfb-panel">
          <div className="panel-header">
            <div>
              <h2>{editingFrame ? `Editing "${editingFrame.name}"` : "Custom Frame Builder"}</h2>
              <p>Design your own frame. Changes preview in real time.</p>
            </div>
          </div>
          <CustomFrameBuilder
            layout={layout}
            shots={shots}
            editingFrame={editingFrame}
            onSave={handleSaveCustomFrame}
            onCancel={() => { setBuilderOpen(false); setEditingFrame(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="step step-frame" role="tabpanel" aria-labelledby="step-frame">
      <div className="step-grid">
        <CompositionCanvasPreview
          layout={layout}
          shots={shots}
          frame={frame}
          frames={allFrames}
          selectedFrameId={selectedFrameId}
          captionText={captionText}
          captionAlign={captionAlign}
          watermarkEnabled={watermarkEnabled}
          onSwipeFrame={handleFrameSwipe}
        />
        <div className="frame-side">
          <div className="frame-picker-wrap">
            <FramePicker
              frames={allFrames}
              selectedFrameId={frame.id}
              customFrameIds={new Set(customFrames.map((f) => f.id))}
              onSelect={handleFrameSelect}
              onEdit={handleEditCustomFrame}
              onDelete={handleDeleteCustomFrame}
              onCreateNew={handleOpenBuilder}
            />
          </div>
          <section className="panel edit-panel" aria-labelledby="editTitle">
            <div className="panel-header">
              <div>
                <h2 id="editTitle">Refinements</h2>
                <p>Keep it subtle and elegant.</p>
              </div>
            </div>
            <div className="edit-controls">
              <label className="form-field">
                <span className="form-label">Caption</span>
                <input
                  type="text"
                  value={captionText}
                  onChange={(event) => handleCaptionChange(event.target.value)}
                  placeholder="Optional caption"
                  maxLength={CAPTION_LIMIT}
                />
                <span className="form-hint">{captionText.length}/{CAPTION_LIMIT}</span>
              </label>

              {captionText.trim() && (
                <div className="form-field caption-align-field">
                  <span className="form-label">Caption alignment</span>
                  <div className="caption-align-group" role="group" aria-label="Caption alignment">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        className={`caption-align-btn ${captionAlign === align ? "is-active" : ""}`}
                        onClick={() => onSetCaptionAlign(align)}
                        aria-pressed={captionAlign === align}
                        aria-label={`Align ${align}`}
                      >
                        {align === "left" ? "⬅" : align === "center" ? "↔" : "➡"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="toggle-field">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(event) => onSetWatermark(event.target.checked)}
                />
                <div>
                  <span className="form-label">Watermark</span>
                  <p>Adds the PaperSnap wordmark in the corner.</p>
                </div>
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="panel step-actions">
        <div className="step-actions-meta">
          <strong>{frame.name} frame</strong>
          <span>Ready to export</span>
        </div>
        <div className="step-actions-buttons">
          <button type="button" className="btn ghost" onClick={onBack}>
            Back
          </button>
          <button type="button" className="btn primary" onClick={onNext} disabled={!isNextEnabled}>
            Next: Export
          </button>
        </div>
      </div>
    </div>
  );
};
