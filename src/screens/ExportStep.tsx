import { CompositionCanvasPreview } from "../components/CompositionCanvasPreview";
import { ExportPanel } from "../components/ExportPanel";
import type { FrameStyle } from "../lib/frames";
import type { LayoutTemplate } from "../lib/layouts";
import type { BoothShot } from "../store/useBoothStore";

type ExportStepProps = {
  layout: LayoutTemplate;
  shots: BoothShot[];
  frame: FrameStyle;
  captionText: string;
  watermarkEnabled: boolean;
  email: string;
  onSetEmail: (email: string) => void;
  onBack: () => void;
  onStartOver: () => void;
  onStatusChange: (message: string) => void;
};

export const ExportStep = ({
  layout,
  shots,
  frame,
  captionText,
  watermarkEnabled,
  email,
  onSetEmail,
  onBack,
  onStartOver,
  onStatusChange,
}: ExportStepProps) => {
  return (
    <div className="step step-export" role="tabpanel" aria-labelledby="step-export">
      <div className="step-grid">
        <CompositionCanvasPreview
          layout={layout}
          shots={shots}
          frame={frame}
          captionText={captionText}
          watermarkEnabled={watermarkEnabled}
        />
        <ExportPanel
          layout={layout}
          shots={shots}
          frame={frame}
          captionText={captionText}
          watermarkEnabled={watermarkEnabled}
          email={email}
          onEmailChange={onSetEmail}
          onStartOver={onStartOver}
          onStatusChange={onStatusChange}
        />
      </div>

      <div className="panel step-actions">
        <div className="step-actions-meta">
          <strong>All set</strong>
          <span>Download in PNG or JPG.</span>
        </div>
        <div className="step-actions-buttons">
          <button type="button" className="btn ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};
