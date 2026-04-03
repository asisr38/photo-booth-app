import type { FrameStyle } from "../lib/frames";

type FramePickerProps = {
  frames: FrameStyle[];
  selectedFrameId: string;
  customFrameIds?: Set<string>;
  onSelect: (frameId: string) => void;
  onEdit?: (frame: FrameStyle) => void;
  onDelete?: (frameId: string) => void;
  onCreateNew?: () => void;
};

export const FramePicker = ({
  frames,
  selectedFrameId,
  customFrameIds,
  onSelect,
  onEdit,
  onDelete,
  onCreateNew,
}: FramePickerProps) => {
  return (
    <section className="panel frame-panel" aria-labelledby="frameTitle">
      <div className="panel-header">
        <div>
          <h2 id="frameTitle">Frame</h2>
          <p>Pick a finish that matches the moment. Swipe to browse.</p>
        </div>
        <div className="frame-header-actions">
          <span className="frame-count" aria-label={`${frames.length} frame styles available`}>
            {frames.length} styles
          </span>
          {onCreateNew && (
            <button
              type="button"
              className="btn ghost btn-sm frame-create-btn"
              onClick={onCreateNew}
              title="Create a custom frame"
            >
              + Custom
            </button>
          )}
        </div>
      </div>

      <div className="frame-grid" role="listbox" aria-label="Frame styles">
        {frames.map((frame) => {
          const isActive = frame.id === selectedFrameId;
          const isCustom = customFrameIds?.has(frame.id) ?? false;
          return (
            <div
              key={frame.id}
              className={`frame-card-wrap ${isActive ? "is-active" : ""}`}
            >
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                className={`frame-card ${isActive ? "is-active" : ""}`}
                onClick={() => onSelect(frame.id)}
              >
                <div
                  className="frame-swatch"
                  style={{
                    background: frame.backgroundColor,
                    borderColor: frame.borderColor,
                  }}
                  aria-hidden="true"
                >
                  <span className="frame-swatch-inner"></span>
                </div>
                <div className="frame-card-body">
                  <h3 className="frame-card-title">
                    {frame.name}
                    {isCustom && <span className="frame-custom-badge">Custom</span>}
                  </h3>
                  <p className="frame-card-description">{frame.description}</p>
                </div>
              </button>
              {isCustom && (
                <div className="frame-card-actions">
                  {onEdit && (
                    <button
                      type="button"
                      className="frame-action-btn"
                      onClick={() => onEdit(frame)}
                      aria-label={`Edit ${frame.name}`}
                      title="Edit"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="frame-action-btn frame-action-btn--delete"
                      onClick={() => onDelete(frame.id)}
                      aria-label={`Delete ${frame.name}`}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
