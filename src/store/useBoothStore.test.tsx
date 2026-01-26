import { act, render } from "@testing-library/react";
import { createRef, forwardRef, useImperativeHandle } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT_ID } from "../lib/layouts";
import { BoothProvider, useBoothStore } from "./useBoothStore";

type BoothStore = ReturnType<typeof useBoothStore>;

const StoreHarness = forwardRef<BoothStore, Record<string, never>>((_props, ref) => {
  const store = useBoothStore();
  useImperativeHandle(ref, () => store, [store]);
  return null;
});

StoreHarness.displayName = "StoreHarness";

const setupStore = () => {
  const storeRef = createRef<BoothStore>();
  render(
    <BoothProvider>
      <StoreHarness ref={storeRef} />
    </BoothProvider>
  );
  if (!storeRef.current) {
    throw new Error("Store not ready");
  }
  return storeRef;
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("useBoothStore", () => {
  it("starts with default state", () => {
    const storeRef = setupStore();
    expect(storeRef.current?.state.step).toBe("layout");
    expect(storeRef.current?.state.layoutId).toBe(DEFAULT_LAYOUT_ID);
    expect(storeRef.current?.state.shots).toHaveLength(0);
  });

  it("resets shots when selecting a new layout", () => {
    const storeRef = setupStore();
    act(() => {
      storeRef.current?.actions.captureShot({
        slotIndex: 0,
        dataUrl: "data:image/png;base64,abc",
        width: 10,
        height: 10,
      });
    });
    expect(storeRef.current?.state.shots).toHaveLength(1);

    act(() => {
      storeRef.current?.actions.selectLayout("pairs-horizontal");
    });

    expect(storeRef.current?.state.layoutId).toBe("pairs-horizontal");
    expect(storeRef.current?.state.step).toBe("layout");
    expect(storeRef.current?.state.shots).toHaveLength(0);
  });

  it("clamps captured slot indices and tracks the next empty slot", () => {
    const storeRef = setupStore();
    act(() => {
      storeRef.current?.actions.selectLayout("strip-3");
    });
    act(() => {
      storeRef.current?.actions.captureShot({
        slotIndex: 0,
        dataUrl: "data:image/png;base64,abc",
        width: 10,
        height: 10,
      });
      storeRef.current?.actions.captureShot({
        slotIndex: 99,
        dataUrl: "data:image/png;base64,def",
        width: 10,
        height: 10,
      });
    });

    const shotSlots =
      storeRef.current?.state.shots.map((shot) => shot.slotIndex).sort((a, b) => a - b) ?? [];
    expect(shotSlots).toEqual([0, 2]);
    expect(storeRef.current?.derived.slotsFilled).toBe(2);
    expect(storeRef.current?.derived.nextEmptySlotIndex).toBe(1);
  });
});
