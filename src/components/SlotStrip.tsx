import { useState } from "react";
import type { LayoutTemplate } from "../lib/layouts";
import type { BoothShot } from "../store/useBoothStore";

type SlotStripProps = {
  layout: LayoutTemplate;
  shotsBySlot: Map<number, BoothShot>;
  activeSlotIndex: number;
  onSelectSlot: (slotIndex: number) => void;
  onRetakeSlot: (slotIndex: number) => void;
  onRetakeAll: () => void;
  slotsFilled: number;
  onBack?: () => void;
};

export const SlotStrip = ({
  layout,
  shotsBySlot,
  activeSlotIndex,
  onSelectSlot,
  onRetakeSlot,
  onRetakeAll,
  slotsFilled,
  onBack,
}: SlotStripProps) => {
  const [retakeConfirmSlot, setRetakeConfirmSlot] = useState<number | null>(null);
  const [retakeAllConfirm, setRetakeAllConfirm] = useState(false);

  const handleRetakeClick = (slotIndex: number) => {
    setRetakeConfirmSlot(slotIndex);
  };

  const handleRetakeConfirm = (slotIndex: number) => {
    onRetakeSlot(slotIndex);
    setRetakeConfirmSlot(null);
  };

  const handleRetakeAllClick = () => {
    setRetakeAllConfirm(true);
  };

  const handleRetakeAllConfirm = () => {
    onRetakeAll();
    setRetakeAllConfirm(false);
  };

  return (
    <section className="panel slot-panel" aria-labelledby="slotTitle">
      <div className="panel-header slot-header">
        <div>
          <h2 id="slotTitle">Shots</h2>
          <p>
            {slotsFilled}/{layout.slotCount} filled
          </p>
        </div>
        <div className="slot-header-actions">
          {onBack && (
            <button type="button" className="btn ghost" onClick={onBack}>
              Back
            </button>
          )}
          {retakeAllConfirm ? (
            <div className="retake-confirm-inline">
              <span>Clear all?</span>
              <button
                type="button"
                className="btn ghost btn-sm"
                onClick={() => setRetakeAllConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn danger btn-sm"
                onClick={handleRetakeAllConfirm}
              >
                Yes, clear
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn ghost"
              onClick={handleRetakeAllClick}
              disabled={slotsFilled === 0}
            >
              Retake All
            </button>
          )}
        </div>
      </div>

      <div className={`slot-grid slot-count-${layout.slotCount}`}>
        {layout.slotRects.map((_slot, index) => {
          const shot = shotsBySlot.get(index);
          const isActive = index === activeSlotIndex;
          const isConfirming = retakeConfirmSlot === index;
          return (
            <div
              key={`${layout.id}-slot-${index}`}
              className={`slot-card ${isActive ? "is-active" : ""} ${!shot ? "is-empty" : ""}`}
            >
              <button
                type="button"
                className="slot-preview"
                onClick={() => onSelectSlot(index)}
                aria-pressed={isActive}
                aria-label={`Slot ${index + 1}${shot ? ", captured" : ", empty"}`}
              >
                {shot ? (
                  <img src={shot.dataUrl} alt={`Captured slot ${index + 1}`} />
                ) : (
                  <div className="slot-placeholder">
                    <span className="slot-placeholder-num">{index + 1}</span>
                    <span className="slot-placeholder-label">Empty</span>
                  </div>
                )}
              </button>
              <div className="slot-actions">
                <span className="slot-label">Slot {index + 1}</span>
                {isConfirming ? (
                  <div className="slot-confirm-row">
                    <button
                      type="button"
                      className="slot-confirm-cancel"
                      onClick={() => setRetakeConfirmSlot(null)}
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      className="slot-confirm-ok"
                      onClick={() => handleRetakeConfirm(index)}
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="slot-retake"
                    onClick={() => handleRetakeClick(index)}
                    disabled={!shot}
                  >
                    Retake
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
