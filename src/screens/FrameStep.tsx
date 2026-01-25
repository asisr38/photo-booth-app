import { CompositionCanvasPreview } from "../components/CompositionCanvasPreview";
import { FramePicker } from "../components/FramePicker";
import { FRAME_STYLES, getFrameById } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import type { BoothShot } from "../store/useBoothStore";

type FrameStepProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  selectedFrameId: string;
  captionText: string;
  watermarkEnabled: boolean;
  onSelectFrame: (frameId: string) => void;
  onSetCaption: (captionText: string) => void;
  onSetWatermark: (enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onStatusChange: (message: string) => void;
};

const CAPTION_LIMIT = 60;

export const FrameStep = ({
  layout,
  shots,
  selectedFrameId,
  captionText,
  watermarkEnabled,
  onSelectFrame,
  onSetCaption,
  onSetWatermark,
  onNext,
  onBack,
  onStatusChange,
}: FrameStepProps) => {
  const frame = getFrameById(selectedFrameId);
  const isNextEnabled = shots.length >= layout.slotCount;

  const handleFrameSelect = (frameId: string) => {
    onSelectFrame(frameId);
    const frameName = FRAME_STYLES.find((item) => item.id === frameId)?.name ?? "Frame";
    onStatusChange(
      frameId === selectedFrameId
        ? `${frameName} frame selected.`
        : `${frameName} selected. Adjust and continue when ready.`
    );
  };

  const handleCaptionChange = (value: string) => {
    onSetCaption(value.slice(0, CAPTION_LIMIT));
  };

  return (
    <div className="step step-frame" role="tabpanel" aria-labelledby="step-frame">
      <div className="step-grid">
        <CompositionCanvasPreview
          layout={layout}
          shots={shots}
          frame={frame}
          captionText={captionText}
          watermarkEnabled={watermarkEnabled}
        />
        <div className="frame-side">
          <FramePicker frames={FRAME_STYLES} selectedFrameId={frame.id} onSelect={handleFrameSelect} />
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
              <label className="toggle-field">
                <input
                  type="checkbox"
                  checked={watermarkEnabled}
                  onChange={(event) => onSetWatermark(event.target.checked)}
                />
                <div>
                  <span className="form-label">Watermark</span>
                  <p>Adds a small Paper Snap mark in the corner.</p>
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
