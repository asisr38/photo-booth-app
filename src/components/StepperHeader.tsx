import type { BoothStep } from "../store/useBoothStore";

type StepConfig = {
  id: BoothStep;
  label: string;
  shortLabel: string;
};

type StepperHeaderProps = {
  currentStep: BoothStep;
};

const STEPS: StepConfig[] = [
  { id: "layout", label: "Layout", shortLabel: "Layout" },
  { id: "capture", label: "Capture", shortLabel: "Capture" },
  { id: "frame", label: "Frame", shortLabel: "Frame" },
  { id: "export", label: "Export", shortLabel: "Export" },
];

export const StepperHeader = ({ currentStep }: StepperHeaderProps) => {
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
        const isComplete = index < safeIndex;
        return (
          <div
            key={step.id}
            className={`stepper-item ${isActive ? "is-active" : ""} ${
              isComplete ? "is-complete" : ""
            }`}
            aria-current={isActive ? "step" : undefined}
            role="listitem"
          >
            <span className="stepper-dot" aria-hidden="true"></span>
            <span className="stepper-label" data-full={step.label}>
              {step.shortLabel}
            </span>
          </div>
        );
      })}
    </nav>
  );
};
