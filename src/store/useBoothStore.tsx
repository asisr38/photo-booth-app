import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  DEFAULT_LAYOUT_ID,
  getLayoutById,
  type LayoutTemplate,
} from "../lib/layouts";
import { DEFAULT_FRAME_ID, FRAME_STYLES, type FrameStyle } from "../lib/frames";

export type BoothStep = "layout" | "capture" | "frame" | "export";

export type BoothShot = {
  slotIndex: number;
  dataUrl: string;
  width: number;
  height: number;
  capturedAt: number;
  filterId?: string;
};

type BoothState = {
  step: BoothStep;
  layoutId: string;
  shots: BoothShot[];
  countdownSeconds: 0 | 3 | 5 | 10;
  selectedFrameId: string;
  captionText: string;
  captionAlign: "left" | "center" | "right";
  watermarkEnabled: boolean;
  mirrorPreview: boolean;
  email: string;
  customFrames: FrameStyle[];
};

type PersistedBoothState = Pick<
  BoothState,
  | "layoutId"
  | "countdownSeconds"
  | "selectedFrameId"
  | "captionText"
  | "captionAlign"
  | "watermarkEnabled"
  | "mirrorPreview"
  | "email"
  | "customFrames"
>;

type BoothAction =
  | { type: "SET_STEP"; step: BoothStep }
  | { type: "SELECT_LAYOUT"; layoutId: string }
  | { type: "SET_COUNTDOWN"; seconds: 0 | 3 | 5 | 10 }
  | { type: "CAPTURE_SHOT"; shot: Omit<BoothShot, "capturedAt"> }
  | { type: "RETAKE_SHOT"; slotIndex: number }
  | { type: "RETAKE_ALL" }
  | { type: "SELECT_FRAME"; frameId: string }
  | { type: "SET_CAPTION"; captionText: string }
  | { type: "SET_CAPTION_ALIGN"; align: "left" | "center" | "right" }
  | { type: "SET_WATERMARK"; enabled: boolean }
  | { type: "SET_MIRROR"; enabled: boolean }
  | { type: "SET_EMAIL"; email: string }
  | { type: "ADD_CUSTOM_FRAME"; frame: FrameStyle }
  | { type: "REMOVE_CUSTOM_FRAME"; frameId: string }
  | { type: "UPDATE_CUSTOM_FRAME"; frame: FrameStyle }
  | { type: "RESET_ALL"; layoutId?: string };

type BoothDerived = {
  layout: LayoutTemplate;
  slotCount: number;
  shotsBySlot: Map<number, BoothShot>;
  slotsFilled: number;
  isCaptureComplete: boolean;
  nextEmptySlotIndex: number;
  allFrames: FrameStyle[];
};

type BoothStore = {
  state: BoothState;
  derived: BoothDerived;
  actions: {
    setStep: (step: BoothStep) => void;
    goNext: () => void;
    goBack: () => void;
    selectLayout: (layoutId: string) => void;
    setCountdown: (seconds: 0 | 3 | 5 | 10) => void;
    captureShot: (shot: Omit<BoothShot, "capturedAt">) => void;
    retakeShot: (slotIndex: number) => void;
    retakeAll: () => void;
    selectFrame: (frameId: string) => void;
    setCaption: (captionText: string) => void;
    setCaptionAlign: (align: "left" | "center" | "right") => void;
    setWatermark: (enabled: boolean) => void;
    setMirror: (enabled: boolean) => void;
    setEmail: (email: string) => void;
    addCustomFrame: (frame: FrameStyle) => void;
    removeCustomFrame: (frameId: string) => void;
    updateCustomFrame: (frame: FrameStyle) => void;
    resetAll: () => void;
  };
};

const STORAGE_KEY = "photo-booth-state";

const STEP_ORDER: BoothStep[] = ["layout", "capture", "frame", "export"];

const defaultState: BoothState = {
  step: "layout",
  layoutId: DEFAULT_LAYOUT_ID,
  shots: [],
  countdownSeconds: 3,
  selectedFrameId: DEFAULT_FRAME_ID,
  captionText: "",
  captionAlign: "center",
  watermarkEnabled: true,
  mirrorPreview: true,
  email: "",
  customFrames: [],
};

const toPersistedState = (state: BoothState): PersistedBoothState => ({
  layoutId: state.layoutId,
  countdownSeconds: state.countdownSeconds,
  selectedFrameId: state.selectedFrameId,
  captionText: state.captionText,
  captionAlign: state.captionAlign,
  watermarkEnabled: state.watermarkEnabled,
  mirrorPreview: state.mirrorPreview,
  email: state.email,
  customFrames: state.customFrames,
});

const fromPersistedState = (parsed: Partial<PersistedBoothState>): BoothState => ({
  ...defaultState,
  ...parsed,
  step: "layout",
  shots: [],
  captionAlign: parsed.captionAlign ?? "center",
  customFrames: Array.isArray(parsed.customFrames) ? parsed.customFrames : [],
});

const getInitialState = (): BoothState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    const parsed = JSON.parse(raw) as Partial<BoothState> & Partial<PersistedBoothState>;
    if (Array.isArray(parsed.shots) && parsed.shots.length > 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    return fromPersistedState(parsed);
  } catch (error) {
    window.localStorage.removeItem(STORAGE_KEY);
    return defaultState;
  }
};

const ensureSlotWithinRange = (layout: LayoutTemplate, slotIndex: number): number => {
  if (!Number.isFinite(slotIndex)) {
    return 0;
  }
  return Math.min(Math.max(0, slotIndex), layout.slotCount - 1);
};

const boothReducer = (state: BoothState, action: BoothAction): BoothState => {
  if (action.type === "RESET_ALL") {
    return {
      ...getInitialState(),
      layoutId: action.layoutId ?? DEFAULT_LAYOUT_ID,
      step: "layout",
      shots: [],
      customFrames: state.customFrames,
    };
  }

  const layout = getLayoutById(state.layoutId);

  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SELECT_LAYOUT":
      return {
        ...state,
        layoutId: action.layoutId,
        shots: [],
        step: "layout",
      };
    case "SET_COUNTDOWN":
      return { ...state, countdownSeconds: action.seconds };
    case "CAPTURE_SHOT": {
      const slotIndex = ensureSlotWithinRange(layout, action.shot.slotIndex);
      const nextShot: BoothShot = {
        ...action.shot,
        slotIndex,
        capturedAt: Date.now(),
      };
      const remainingShots = state.shots.filter((shot) => shot.slotIndex !== slotIndex);
      return { ...state, shots: [...remainingShots, nextShot] };
    }
    case "RETAKE_SHOT":
      return {
        ...state,
        shots: state.shots.filter((shot) => shot.slotIndex !== action.slotIndex),
      };
    case "RETAKE_ALL":
      return { ...state, shots: [] };
    case "SELECT_FRAME":
      return { ...state, selectedFrameId: action.frameId };
    case "SET_CAPTION":
      return { ...state, captionText: action.captionText };
    case "SET_CAPTION_ALIGN":
      return { ...state, captionAlign: action.align };
    case "SET_WATERMARK":
      return { ...state, watermarkEnabled: action.enabled };
    case "SET_MIRROR":
      return { ...state, mirrorPreview: action.enabled };
    case "SET_EMAIL":
      return { ...state, email: action.email };
    case "ADD_CUSTOM_FRAME":
      return { ...state, customFrames: [...state.customFrames, action.frame] };
    case "REMOVE_CUSTOM_FRAME":
      return {
        ...state,
        customFrames: state.customFrames.filter((f) => f.id !== action.frameId),
        selectedFrameId: state.selectedFrameId === action.frameId ? DEFAULT_FRAME_ID : state.selectedFrameId,
      };
    case "UPDATE_CUSTOM_FRAME":
      return {
        ...state,
        customFrames: state.customFrames.map((f) => f.id === action.frame.id ? action.frame : f),
      };
    default:
      return state;
  }
};

const BoothContext = createContext<BoothStore | null>(null);

export const BoothProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(boothReducer, undefined, getInitialState);

  const derived = useMemo<BoothDerived>(() => {
    const layout = getLayoutById(state.layoutId);
    const shotsBySlot = new Map<number, BoothShot>();
    state.shots.forEach((shot) => shotsBySlot.set(shot.slotIndex, shot));
    const slotsFilled = layout.slotRects.reduce((count, _slot, index) => {
      return shotsBySlot.has(index) ? count + 1 : count;
    }, 0);
    const nextEmptySlotIndex = layout.slotRects.findIndex((_slot, index) => !shotsBySlot.has(index));

    return {
      layout,
      slotCount: layout.slotCount,
      shotsBySlot,
      slotsFilled,
      isCaptureComplete: slotsFilled >= layout.slotCount,
      nextEmptySlotIndex: nextEmptySlotIndex === -1 ? layout.slotCount - 1 : nextEmptySlotIndex,
      allFrames: [...FRAME_STYLES, ...state.customFrames],
    };
  }, [state.layoutId, state.shots, state.customFrames, FRAME_STYLES]);

  const persistedState = useMemo(() => toPersistedState(state), [
    state.captionText,
    state.captionAlign,
    state.countdownSeconds,
    state.layoutId,
    state.mirrorPreview,
    state.selectedFrameId,
    state.watermarkEnabled,
    state.email,
    state.customFrames,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
      } catch (retryError) {
        // Give up silently; the app should still work without persistence.
      }
    }
  }, [persistedState]);

  const setStep = useCallback((step: BoothStep) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step);
    const next = STEP_ORDER[Math.min(STEP_ORDER.length - 1, currentIndex + 1)];
    dispatch({ type: "SET_STEP", step: next });
  }, [state.step]);

  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(state.step);
    const prev = STEP_ORDER[Math.max(0, currentIndex - 1)];
    dispatch({ type: "SET_STEP", step: prev });
  }, [state.step]);

  const selectLayout = useCallback((layoutId: string) => {
    dispatch({ type: "SELECT_LAYOUT", layoutId });
  }, []);

  const setCountdown = useCallback((seconds: 0 | 3 | 5 | 10) => {
    dispatch({ type: "SET_COUNTDOWN", seconds });
  }, []);

  const captureShot = useCallback((shot: Omit<BoothShot, "capturedAt">) => {
    dispatch({ type: "CAPTURE_SHOT", shot });
  }, []);

  const retakeShot = useCallback((slotIndex: number) => {
    dispatch({ type: "RETAKE_SHOT", slotIndex });
  }, []);

  const retakeAll = useCallback(() => {
    dispatch({ type: "RETAKE_ALL" });
  }, []);

  const selectFrame = useCallback((frameId: string) => {
    dispatch({ type: "SELECT_FRAME", frameId });
  }, []);

  const setCaption = useCallback((captionText: string) => {
    dispatch({ type: "SET_CAPTION", captionText });
  }, []);

  const setCaptionAlign = useCallback((align: "left" | "center" | "right") => {
    dispatch({ type: "SET_CAPTION_ALIGN", align });
  }, []);

  const setWatermark = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_WATERMARK", enabled });
  }, []);

  const setMirror = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_MIRROR", enabled });
  }, []);

  const setEmail = useCallback((email: string) => {
    dispatch({ type: "SET_EMAIL", email });
  }, []);

  const addCustomFrame = useCallback((frame: FrameStyle) => {
    dispatch({ type: "ADD_CUSTOM_FRAME", frame });
  }, []);

  const removeCustomFrame = useCallback((frameId: string) => {
    dispatch({ type: "REMOVE_CUSTOM_FRAME", frameId });
  }, []);

  const updateCustomFrame = useCallback((frame: FrameStyle) => {
    dispatch({ type: "UPDATE_CUSTOM_FRAME", frame });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: "RESET_ALL" });
  }, []);

  const store = useMemo<BoothStore>(
    () => ({
      state,
      derived,
      actions: {
        setStep,
        goNext,
        goBack,
        selectLayout,
        setCountdown,
        captureShot,
        retakeShot,
        retakeAll,
        selectFrame,
        setCaption,
        setCaptionAlign,
        setWatermark,
        setMirror,
        setEmail,
        addCustomFrame,
        removeCustomFrame,
        updateCustomFrame,
        resetAll,
      },
    }),
    [
      addCustomFrame,
      captureShot,
      derived,
      goBack,
      goNext,
      removeCustomFrame,
      resetAll,
      retakeAll,
      retakeShot,
      selectFrame,
      selectLayout,
      setCaption,
      setCaptionAlign,
      setCountdown,
      setEmail,
      setMirror,
      setStep,
      setWatermark,
      state,
      updateCustomFrame,
    ]
  );

  return <BoothContext.Provider value={store}>{children}</BoothContext.Provider>;
};

export const useBoothStore = (): BoothStore => {
  const context = useContext(BoothContext);
  if (!context) {
    throw new Error("useBoothStore must be used within BoothProvider");
  }
  return context;
};
