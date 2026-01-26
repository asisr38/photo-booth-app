import { describe, expect, it } from "vitest";
import { DEFAULT_FRAME_ID, FRAME_STYLES, getFrameById } from "./frames";

describe("frames", () => {
  it("returns the default frame when the id is unknown", () => {
    expect(getFrameById("not-a-frame").id).toBe(DEFAULT_FRAME_ID);
    expect(getFrameById(undefined).id).toBe(DEFAULT_FRAME_ID);
  });

  it("keeps ids unique", () => {
    const ids = FRAME_STYLES.map((frame) => frame.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("keeps ratios within expected bounds", () => {
    FRAME_STYLES.forEach((frame) => {
      expect(frame.borderWidthRatio).toBeGreaterThan(0);
      expect(frame.borderWidthRatio).toBeLessThan(0.5);
      expect(frame.cornerRadiusRatio).toBeGreaterThan(0);
      expect(frame.cornerRadiusRatio).toBeLessThan(0.5);
      expect(frame.shadowStrength).toBeGreaterThanOrEqual(0);
      expect(frame.shadowStrength).toBeLessThanOrEqual(1);
    });
  });
});
