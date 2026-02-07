import { useEffect, useMemo, useState } from "react";
import { StepperHeader } from "./components/StepperHeader";
import { FUJI_FRAME_ID, getFrameById } from "./lib/frames";
import { getLayoutById } from "./lib/layouts";
import { CaptureStep } from "./screens/CaptureStep";
import { ExportStep } from "./screens/ExportStep";
import { FrameStep } from "./screens/FrameStep";
import { LayoutStep } from "./screens/LayoutStep";
import { BoothProvider, type BoothStep, useBoothStore } from "./store/useBoothStore";

const STEP_ORDER: BoothStep[] = ["layout", "capture", "frame", "export"];

type ViewTransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

const getStepIndex = (step: BoothStep): number => {
  const index = STEP_ORDER.indexOf(step);
  return index >= 0 ? index : 0;
};

const AppShell = () => {
  const { state, derived, actions } = useBoothStore();
  const [status, setStatus] = useState("");
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">(
    "forward"
  );

  const layout = derived.layout;
  const frame = useMemo(() => getFrameById(state.selectedFrameId), [state.selectedFrameId]);

  const setStepWithTransition = (nextStep: BoothStep) => {
    const currentIndex = getStepIndex(state.step);
    const nextIndex = getStepIndex(nextStep);
    setTransitionDirection(nextIndex >= currentIndex ? "forward" : "backward");

    const commitStep = () => {
      actions.setStep(nextStep);
    };

    if (typeof document !== "undefined") {
      const viewTransitionDocument = document as ViewTransitionCapableDocument;
      if (typeof viewTransitionDocument.startViewTransition === "function") {
        viewTransitionDocument.startViewTransition(() => {
          commitStep();
        });
        return;
      }
    }

    commitStep();
  };

  useEffect(() => {
    if (state.step === "frame" || state.step === "export") {
      if (!derived.isCaptureComplete) {
        setStepWithTransition("capture");
        setStatus("Capture all required slots to continue.");
      }
    }
  }, [derived.isCaptureComplete, state.step]);

  const canNavigateTo = (step: BoothStep): boolean => {
    if (step === "layout") {
      return true;
    }
    if (step === "capture") {
      return Boolean(state.layoutId);
    }
    if (step === "frame") {
      return derived.isCaptureComplete;
    }
    if (step === "export") {
      return derived.isCaptureComplete;
    }
    return false;
  };

  const goToStep = (step: BoothStep, options?: { preserveStatus?: boolean }) => {
    if (!canNavigateTo(step)) {
      if (step === "frame" || step === "export") {
        setStatus("Capture all required slots to unlock the next step.");
      }
      return;
    }
    setStepWithTransition(step);
    if (!options?.preserveStatus) {
      setStatus("");
    }
  };

  const handleNext = () => {
    if (state.step === "layout") {
      goToStep("capture");
      return;
    }
    if (state.step === "capture") {
      if (!derived.isCaptureComplete) {
        setStatus("Finish all slots before moving on.");
        return;
      }
      goToStep("frame");
      return;
    }
    if (state.step === "frame") {
      goToStep("export");
    }
  };

  const handleBack = () => {
    if (state.step === "capture") {
      goToStep("layout");
      return;
    }
    if (state.step === "frame") {
      goToStep("capture");
      return;
    }
    if (state.step === "export") {
      goToStep("frame");
    }
  };

  const handleSelectLayout = (layoutId: string) => {
    actions.selectLayout(layoutId);
    const selectedLayout = getLayoutById(layoutId);
    setStatus(`${selectedLayout.name} selected.`);
    goToStep("capture", { preserveStatus: true });
  };

  const handleCaptureShot = (
    slotIndex: number,
    payload: { dataUrl: string; width: number; height: number }
  ) => {
    actions.captureShot({ slotIndex, ...payload });
  };

  const handleCaptureComplete = () => {
    if (state.selectedFrameId === FUJI_FRAME_ID) {
      setStatus("Fuji Instant selected. Jumping to print preview.");
      setStepWithTransition("export");
      return;
    }
    setStatus("All shots captured. Review and retake if needed.");
  };

  const handleStartOver = () => {
    actions.resetAll();
    setStatus("Reset complete. Choose a layout to begin again.");
    setStepWithTransition("layout");
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="brand">
          <h1 className="brand-title">PaperSnap</h1>
        </div>
        <div className="status" role="status" aria-live="polite">
          {status}
        </div>
      </header>

      <StepperHeader currentStep={state.step} />

      <main
        className={`wizard wizard-transition-${transitionDirection}`}
        data-step={state.step}
      >
        {state.step === "layout" && (
          <LayoutStep
            selectedLayoutId={state.layoutId}
            onSelectLayout={handleSelectLayout}
            onNext={handleNext}
          />
        )}

        {state.step === "capture" && (
          <CaptureStep
            layout={layout}
            shots={state.shots}
            shotsBySlot={derived.shotsBySlot}
            slotsFilled={derived.slotsFilled}
            nextEmptySlotIndex={derived.nextEmptySlotIndex}
            countdownSeconds={state.countdownSeconds}
            mirrorPreview={state.mirrorPreview}
            onCountdownChange={actions.setCountdown}
            onMirrorChange={actions.setMirror}
            onCaptureShot={handleCaptureShot}
            onRetakeShot={actions.retakeShot}
            onRetakeAll={() => {
              actions.retakeAll();
              setStatus("All slots cleared.");
            }}
            onNext={handleNext}
            onCaptureComplete={handleCaptureComplete}
            onBack={handleBack}
            onStatusChange={setStatus}
          />
        )}

        {state.step === "frame" && (
          <FrameStep
            layout={layout}
            shots={state.shots}
            selectedFrameId={frame.id}
            captionText={state.captionText}
            watermarkEnabled={state.watermarkEnabled}
            onSelectFrame={actions.selectFrame}
            onSetCaption={actions.setCaption}
            onSetWatermark={actions.setWatermark}
            onNext={handleNext}
            onBack={handleBack}
            onStatusChange={setStatus}
          />
        )}

        {state.step === "export" && (
          <ExportStep
            layout={layout}
            shots={state.shots}
            frame={frame}
            captionText={state.captionText}
            watermarkEnabled={state.watermarkEnabled}
            email={state.email}
            onSetEmail={actions.setEmail}
            onBack={handleBack}
            onStartOver={handleStartOver}
            onStatusChange={setStatus}
          />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BoothProvider>
      <AppShell />
    </BoothProvider>
  );
}
