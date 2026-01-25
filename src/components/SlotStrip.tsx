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
          <button type="button" className="btn ghost" onClick={onRetakeAll} disabled={slotsFilled === 0}>
            Retake All
          </button>
        </div>
      </div>

      <div className={`slot-grid slot-count-${layout.slotCount}`}>
        {layout.slotRects.map((_slot, index) => {
          const shot = shotsBySlot.get(index);
          const isActive = index === activeSlotIndex;
          return (
            <div key={`${layout.id}-slot-${index}`} className={`slot-card ${isActive ? "is-active" : ""}`}>
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
                    <span>{index + 1}</span>
                  </div>
                )}
              </button>
              <div className="slot-actions">
                <span className="slot-label">Slot {index + 1}</span>
                <button
                  type="button"
                  className="slot-retake"
                  onClick={() => onRetakeSlot(index)}
                  disabled={!shot}
                >
                  Retake
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
