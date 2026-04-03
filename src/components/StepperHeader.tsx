import type { BoothStep } from "../store/useBoothStore";

type StepConfig = {
  id: BoothStep;
  label: string;
  shortLabel: string;
};

type StepperHeaderProps = {
  currentStep: BoothStep;
  completedSteps?: Set<BoothStep>;
  onNavigate?: (step: BoothStep) => void;
};

const STEPS: StepConfig[] = [
  { id: "layout", label: "Layout", shortLabel: "Layout" },
  { id: "capture", label: "Capture", shortLabel: "Capture" },
  { id: "frame", label: "Frame", shortLabel: "Frame" },
  { id: "export", label: "Export", shortLabel: "Export" },
];

export const StepperHeader = ({ currentStep, completedSteps, onNavigate }: StepperHeaderProps) => {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);
  const safeIndex = Math.max(0, currentIndex);
  const maxIndex = STEPS.length - 1;
  const progressPercent = maxIndex <= 0 ? 0 : (safeIndex / maxIndex) * 100;

  return (
    <nav className="stepper" aria-label="Photo booth steps" role="list">
      <div className="stepper-track" aria-hidden="true">
        <div className="stepper-track-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < safeIndex || completedSteps?.has(step.id);
        const isNavigable = isComplete && !isActive && onNavigate;
        return (
          <div
            key={step.id}
            className={`stepper-item ${isActive ? "is-active" : ""} ${
              isComplete ? "is-complete" : ""
            } ${isNavigable ? "is-navigable" : ""}`}
            aria-current={isActive ? "step" : undefined}
            role="listitem"
          >
            {isNavigable ? (
              <button
                type="button"
                className="stepper-btn"
                onClick={() => onNavigate(step.id)}
                aria-label={`Go back to ${step.label}`}
                title={`Back to ${step.label}`}
              >
                <span className="stepper-dot" aria-hidden="true"></span>
                <span className="stepper-label" data-full={step.label}>
                  {step.shortLabel}
                </span>
              </button>
            ) : (
              <>
                <span className="stepper-dot" aria-hidden="true"></span>
                <span className="stepper-label" data-full={step.label}>
                  {step.shortLabel}
                </span>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};
