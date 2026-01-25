import type { BoothStep } from "../store/useBoothStore";

type StepConfig = {
  id: BoothStep;
  label: string;
  shortLabel: string;
};

type StepperHeaderProps = {
  currentStep: BoothStep;
  canNavigateTo: (step: BoothStep) => boolean;
  onNavigate: (step: BoothStep) => void;
};

const STEPS: StepConfig[] = [
  { id: "layout", label: "Layout", shortLabel: "Layout" },
  { id: "capture", label: "Capture", shortLabel: "Capture" },
  { id: "frame", label: "Frame", shortLabel: "Frame" },
  { id: "export", label: "Export", shortLabel: "Export" },
];

export const StepperHeader = ({ currentStep, canNavigateTo, onNavigate }: StepperHeaderProps) => {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav className="stepper" aria-label="Photo booth steps">
      {STEPS.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentIndex;
        const isAllowed = canNavigateTo(step.id);
        return (
          <button
            key={step.id}
            type="button"
            className={`stepper-item ${isActive ? "is-active" : ""} ${
              isComplete ? "is-complete" : ""
            }`}
            onClick={() => isAllowed && onNavigate(step.id)}
            disabled={!isAllowed}
            aria-current={isActive ? "step" : undefined}
          >
            <span className="stepper-dot" aria-hidden="true">
              {index + 1}
            </span>
            <span className="stepper-label" data-full={step.label}>
              {step.shortLabel}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
