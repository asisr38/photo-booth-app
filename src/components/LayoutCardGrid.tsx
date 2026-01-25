import type { LayoutTemplate } from "../lib/layouts";

type LayoutCardGridProps = {
  layouts: LayoutTemplate[];
  selectedLayoutId: string;
  onSelect: (layoutId: string) => void;
};

export const LayoutCardGrid = ({ layouts, selectedLayoutId, onSelect }: LayoutCardGridProps) => {
  return (
    <div className="layout-grid" role="listbox" aria-label="Layout options">
      {layouts.map((layout) => {
        const isActive = layout.id === selectedLayoutId;
        return (
          <button
            key={layout.id}
            type="button"
            role="option"
            aria-selected={isActive}
            className={`layout-card ${isActive ? "is-active" : ""}`}
            onClick={() => onSelect(layout.id)}
          >
            <div className="layout-card-preview" aria-hidden="true">
              <div className="layout-preview-frame">
                {layout.slotRects.map((slot, index) => (
                  <span
                    key={`${layout.id}-${index}`}
                    className="layout-preview-slot"
                    style={{
                      left: `${slot.x * 100}%`,
                      top: `${slot.y * 100}%`,
                      width: `${slot.w * 100}%`,
                      height: `${slot.h * 100}%`,
                    }}
                  ></span>
                ))}
              </div>
            </div>
            <div className="layout-card-body">
              <div className="layout-card-title-row">
                <h3 className="layout-card-title">{layout.name}</h3>
                <span className="layout-card-meta">{layout.aspectRatio}</span>
              </div>
              <p className="layout-card-description">{layout.description}</p>
              <div className="layout-card-footer">
                <span>{layout.slotCount} shots</span>
                <span>
                  {layout.exportSize.width}x{layout.exportSize.height}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
