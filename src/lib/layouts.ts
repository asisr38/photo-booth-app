export type SlotRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ExportSize = {
  width: number;
  height: number;
};

export type LayoutTemplate = {
  id: string;
  name: string;
  description: string;
  aspectRatio: string;
  slotCount: number;
  slotRects: SlotRect[];
  exportSize: ExportSize;
};

const fullRect: SlotRect = { x: 0, y: 0, w: 1, h: 1 };

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "strip-3",
    name: "3-in-1 (Vertical Strip)",
    description: "Three stacked portraits in a classic booth strip.",
    aspectRatio: "1:3",
    slotCount: 3,
    slotRects: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
    exportSize: { width: 1200, height: 3600 },
  },
  {
    id: "strip-4",
    name: "4-in-1 (Vertical Strip)",
    description: "Four stacked shots for extra booth energy.",
    aspectRatio: "1:4",
    slotCount: 4,
    slotRects: [
      { x: 0, y: 0, w: 1, h: 0.25 },
      { x: 0, y: 0.25, w: 1, h: 0.25 },
      { x: 0, y: 0.5, w: 1, h: 0.25 },
      { x: 0, y: 0.75, w: 1, h: 0.25 },
    ],
    exportSize: { width: 1200, height: 4800 },
  },
  {
    id: "hero-3",
    name: "Hero + Pair",
    description: "One big hero shot with two smaller moments below.",
    aspectRatio: "2:3",
    slotCount: 3,
    slotRects: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
    exportSize: { width: 1600, height: 2400 },
  },
  {
    id: "pairs-horizontal",
    name: "Pairs (Side by Side)",
    description: "Two photos arranged horizontally.",
    aspectRatio: "2:1",
    slotCount: 2,
    slotRects: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    exportSize: { width: 2400, height: 1200 },
  },
  {
    id: "pairs-vertical",
    name: "Pairs (Stacked)",
    description: "Two photos arranged vertically.",
    aspectRatio: "1:2",
    slotCount: 2,
    slotRects: [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ],
    exportSize: { width: 1200, height: 2400 },
  },
  {
    id: "triptych-wide",
    name: "Triptych Wide",
    description: "Three equal portraits across a wide canvas.",
    aspectRatio: "3:2",
    slotCount: 3,
    slotRects: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
    exportSize: { width: 3000, height: 2000 },
  },
  {
    id: "duo-tall",
    name: "Tall Duo + Solo",
    description: "Two stacked shots next to one full-height hero.",
    aspectRatio: "4:3",
    slotCount: 3,
    slotRects: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    exportSize: { width: 2400, height: 1800 },
  },
  {
    id: "single",
    name: "Single",
    description: "One hero portrait.",
    aspectRatio: "4:5",
    slotCount: 1,
    slotRects: [fullRect],
    exportSize: { width: 1600, height: 2000 },
  },
  {
    id: "grid-2x2",
    name: "2x2 Grid",
    description: "Four equal squares in a grid.",
    aspectRatio: "1:1",
    slotCount: 4,
    slotRects: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    exportSize: { width: 2400, height: 2400 },
  },
];

export const DEFAULT_LAYOUT_ID = LAYOUT_TEMPLATES[0].id;

export const getLayoutById = (id: string | null | undefined): LayoutTemplate => {
  const found = LAYOUT_TEMPLATES.find((layout) => layout.id === id);
  return found ?? LAYOUT_TEMPLATES[0];
};
