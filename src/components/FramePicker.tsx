import type { FrameStyle } from "../lib/frames";

type FramePickerProps = {
  frames: FrameStyle[];
  selectedFrameId: string;
  onSelect: (frameId: string) => void;
};

export const FramePicker = ({ frames, selectedFrameId, onSelect }: FramePickerProps) => {
  return (
    <section className="panel frame-panel" aria-labelledby="frameTitle">
      <div className="panel-header">
        <div>
          <h2 id="frameTitle">Frame</h2>
          <p>Pick a finish that matches the moment. Swipe on mobile, tap on desktop.</p>
        </div>
        <span className="frame-count" aria-label={`${frames.length} frame styles available`}>
          {frames.length} styles
        </span>
      </div>

      <div className="frame-grid" role="listbox" aria-label="Frame styles">
        {frames.map((frame) => {
          const isActive = frame.id === selectedFrameId;
          return (
            <button
              key={frame.id}
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
                <h3 className="frame-card-title">{frame.name}</h3>
                <p className="frame-card-description">{frame.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
