import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT_ID, getLayoutById, LAYOUT_TEMPLATES } from "./layouts";

const parseAspectRatio = (aspectRatio: string): number => {
  const [width, height] = aspectRatio.split(":").map((value) => Number(value));
  return width / height;
};

describe("layouts", () => {
  it("returns the default layout when the id is unknown", () => {
    expect(getLayoutById("not-a-layout").id).toBe(DEFAULT_LAYOUT_ID);
    expect(getLayoutById(null).id).toBe(DEFAULT_LAYOUT_ID);
  });

  it("keeps ids unique", () => {
    const ids = LAYOUT_TEMPLATES.map((layout) => layout.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("matches slot counts and keeps slot rects within bounds", () => {
    const epsilon = 0.0001;
    LAYOUT_TEMPLATES.forEach((layout) => {
      expect(layout.slotCount).toBe(layout.slotRects.length);
      layout.slotRects.forEach((rect) => {
        expect(rect.w).toBeGreaterThan(0);
        expect(rect.h).toBeGreaterThan(0);
        expect(rect.x).toBeGreaterThanOrEqual(-epsilon);
        expect(rect.y).toBeGreaterThanOrEqual(-epsilon);
        expect(rect.x + rect.w).toBeLessThanOrEqual(1 + epsilon);
        expect(rect.y + rect.h).toBeLessThanOrEqual(1 + epsilon);
      });
    });
  });

  it("keeps export sizes aligned to the declared aspect ratios", () => {
    LAYOUT_TEMPLATES.forEach((layout) => {
      const ratio = parseAspectRatio(layout.aspectRatio);
      const exportRatio = layout.exportSize.width / layout.exportSize.height;
      expect(exportRatio).toBeCloseTo(ratio, 2);
    });
  });
});
