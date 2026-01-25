import { useEffect, useMemo, useState } from "react";
import { CameraPreview } from "../components/CameraPreview";
import { SlotStrip } from "../components/SlotStrip";
import type { LayoutTemplate } from "../lib/layouts";
import type { BoothShot } from "../store/useBoothStore";

type CountdownSeconds = 0 | 3 | 5 | 10;

type CapturePayload = {
  dataUrl: string;
  width: number;
  height: number;
};

type PendingCapture = {
  slotIndex: number;
  payload: CapturePayload;
};

type CaptureStepProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  shotsBySlot: Map<number, BoothShot>;
  slotsFilled: number;
  nextEmptySlotIndex: number;
  countdownSeconds: CountdownSeconds;
  mirrorPreview: boolean;
  onCountdownChange: (seconds: CountdownSeconds) => void;
  onMirrorChange: (enabled: boolean) => void;
  onCaptureShot: (slotIndex: number, payload: CapturePayload) => void;
  onRetakeShot: (slotIndex: number) => void;
  onRetakeAll: () => void;
  onNext: () => void;
  onCaptureComplete: () => void;
  onBack: () => void;
  onStatusChange: (message: string) => void;
};

const findNextEmptySlot = (layout: LayoutTemplate, filledSlots: Set<number>): number => {
  for (let index = 0; index < layout.slotCount; index += 1) {
    if (!filledSlots.has(index)) {
      return index;
    }
  }
  return layout.slotCount - 1;
};

export const CaptureStep = ({
  layout,
  shots,
  shotsBySlot,
  slotsFilled,
  nextEmptySlotIndex,
  countdownSeconds,
  mirrorPreview,
  onCountdownChange,
  onMirrorChange,
  onCaptureShot,
  onRetakeShot,
  onRetakeAll,
  onNext,
  onCaptureComplete,
  onBack,
  onStatusChange,
}: CaptureStepProps) => {
  const [activeSlotIndex, setActiveSlotIndex] = useState(nextEmptySlotIndex);
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);

  useEffect(() => {
    setActiveSlotIndex(nextEmptySlotIndex);
    setPendingCapture(null);
  }, [layout.id, nextEmptySlotIndex]);

  const activeSlotSafe = useMemo(() => {
    return Math.min(Math.max(0, activeSlotIndex), layout.slotCount - 1);
  }, [activeSlotIndex, layout.slotCount]);

  const handleSelectSlot = (slotIndex: number) => {
    setActiveSlotIndex(slotIndex);
    setPendingCapture(null);
  };

  const handleRetakeSlot = (slotIndex: number) => {
    onRetakeShot(slotIndex);
    setActiveSlotIndex(slotIndex);
    if (pendingCapture?.slotIndex === slotIndex) {
      setPendingCapture(null);
    }
    onStatusChange(`Slot ${slotIndex + 1} cleared. Capture again when ready.`);
  };

  const handleCaptured = (payload: CapturePayload) => {
    setPendingCapture({ slotIndex: activeSlotSafe, payload });
    onStatusChange(`Review slot ${activeSlotSafe + 1}.`);
  };

  const handleConfirmCapture = () => {
    if (!pendingCapture) {
      return;
    }
    onCaptureShot(pendingCapture.slotIndex, pendingCapture.payload);
    const filledSlots = new Set<number>(shots.map((shot) => shot.slotIndex));
    filledSlots.add(pendingCapture.slotIndex);
    const filledCount = filledSlots.size;
    setPendingCapture(null);

    if (filledCount >= layout.slotCount) {
      onStatusChange("All shots captured. Choose a frame.");
      onCaptureComplete();
      return;
    }

    const nextSlot = findNextEmptySlot(layout, filledSlots);
    setActiveSlotIndex(nextSlot);
    onStatusChange(`Slot ${pendingCapture.slotIndex + 1} saved. Keep going.`);
  };

  const handleRetakePending = () => {
    if (!pendingCapture) {
      return;
    }
    setPendingCapture(null);
    setActiveSlotIndex(pendingCapture.slotIndex);
    onStatusChange(`Retake slot ${pendingCapture.slotIndex + 1} when ready.`);
  };

  const handleRetakeAll = () => {
    setPendingCapture(null);
    onRetakeAll();
    setActiveSlotIndex(0);
    onStatusChange("All slots cleared. Start again.");
  };

  const isNextEnabled = slotsFilled >= layout.slotCount && !pendingCapture;

  return (
    <div className="step step-capture" role="tabpanel" aria-labelledby="step-capture">
      <div className="step-grid">
        <CameraPreview
          countdownSeconds={countdownSeconds}
          onCountdownChange={onCountdownChange}
          mirrorPreview={mirrorPreview}
          onMirrorChange={onMirrorChange}
          pendingCapture={
            pendingCapture
              ? {
                  slotIndex: pendingCapture.slotIndex,
                  slotCount: layout.slotCount,
                  dataUrl: pendingCapture.payload.dataUrl,
                }
              : null
          }
          onConfirmPending={handleConfirmCapture}
          onRetakePending={handleRetakePending}
          onCaptured={handleCaptured}
          onStatusChange={onStatusChange}
        />
        <SlotStrip
          layout={layout}
          shotsBySlot={shotsBySlot}
          activeSlotIndex={activeSlotSafe}
          onSelectSlot={handleSelectSlot}
          onRetakeSlot={handleRetakeSlot}
          onRetakeAll={handleRetakeAll}
          slotsFilled={slotsFilled}
        />
      </div>

      <div className="panel step-actions">
        <div className="step-actions-meta">
          <strong>{layout.name}</strong>
          <span>
            {slotsFilled}/{layout.slotCount} shots captured
          </span>
        </div>
        <div className="step-actions-buttons">
          <button type="button" className="btn ghost" onClick={onBack}>
            Back
          </button>
          <button type="button" className="btn primary" onClick={onNext} disabled={!isNextEnabled}>
            Next: Frame
          </button>
        </div>
      </div>
    </div>
  );
};
