import { LayoutCardGrid } from "../components/LayoutCardGrid";
import { LAYOUT_TEMPLATES } from "../lib/layouts";

type LayoutStepProps = {
  selectedLayoutId: string;
  onSelectLayout: (layoutId: string) => void;
  onNext: () => void;
};

export const LayoutStep = ({ selectedLayoutId, onSelectLayout, onNext }: LayoutStepProps) => {
  const isNextEnabled = Boolean(selectedLayoutId);

  return (
    <div className="step step-layout" role="tabpanel" aria-labelledby="step-layout">
      <section className="panel intro-panel">
        <div className="panel-header intro-header">
          <div>
            <h2>Pick a layout</h2>
            <p>Tap a layout and we will jump straight into the camera.</p>
          </div>
        </div>
        <LayoutCardGrid
          layouts={LAYOUT_TEMPLATES}
          selectedLayoutId={selectedLayoutId}
          onSelect={onSelectLayout}
        />
        <div className="panel-actions">
          <button type="button" className="btn primary" onClick={onNext} disabled={!isNextEnabled}>
            Continue to Capture
          </button>
        </div>
      </section>
    </div>
  );
};
