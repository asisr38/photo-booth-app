export type FrameOverlayKind =
  | "none"
  | "bubbles"
  | "sprinkles"
  | "ribbon"
  | "sparkle"
  | "sticker"
  | "neon"
  | "gold"
  | "vintage"
  | "party";

export type FrameStyle = {
  id: string;
  name: string;
  description: string;
  borderWidthRatio: number;
  cornerRadiusRatio: number;
  backgroundColor: string;
  borderColor: string;
  overlayKind: FrameOverlayKind;
  shadowStrength: number;
};

export const FUJI_FRAME_ID = "fuji-instant";

export const FRAME_STYLES: FrameStyle[] = [
  {
    id: "minimal-pop",
    name: "Minimal Pop",
    description: "Soft white with a clean rounded edge.",
    borderWidthRatio: 0.012,
    cornerRadiusRatio: 0.055,
    backgroundColor: "#ffffff",
    borderColor: "#ffd7e6",
    overlayKind: "none",
    shadowStrength: 0.07,
  },
  {
    id: "blush",
    name: "Blush",
    description: "Creamy blush tones with a cozy border.",
    borderWidthRatio: 0.02,
    cornerRadiusRatio: 0.07,
    backgroundColor: "#fff4f7",
    borderColor: "#ffb3c7",
    overlayKind: "sparkle",
    shadowStrength: 0.1,
  },
  {
    id: "bubblegum",
    name: "Bubblegum",
    description: "Playful pink with floating bubble details.",
    borderWidthRatio: 0.022,
    cornerRadiusRatio: 0.09,
    backgroundColor: "#ffe3f1",
    borderColor: "#ff8fc0",
    overlayKind: "bubbles",
    shadowStrength: 0.12,
  },
  {
    id: "sprinkles",
    name: "Sprinkles",
    description: "Tiny candy sprinkles tucked in the corners.",
    borderWidthRatio: 0.02,
    cornerRadiusRatio: 0.075,
    backgroundColor: "#fff7e8",
    borderColor: "#ffc971",
    overlayKind: "sprinkles",
    shadowStrength: 0.11,
  },
  {
    id: "polaroid",
    name: "Polaroid",
    description: "Crisp white with a thicker bottom margin.",
    borderWidthRatio: 0.028,
    cornerRadiusRatio: 0.045,
    backgroundColor: "#ffffff",
    borderColor: "#e9e9ee",
    overlayKind: "ribbon",
    shadowStrength: 0.09,
  },
  {
    id: FUJI_FRAME_ID,
    name: "Fuji Instant",
    description: "Classic instant film look with a mint edge.",
    borderWidthRatio: 0.032,
    cornerRadiusRatio: 0.038,
    backgroundColor: "#f9f9f4",
    borderColor: "#7ddad0",
    overlayKind: "none",
    shadowStrength: 0.12,
  },
  {
    id: "sticker",
    name: "Sticker",
    description: "Rounded sticker feel with a pop outline.",
    borderWidthRatio: 0.024,
    cornerRadiusRatio: 0.12,
    backgroundColor: "#ffffff",
    borderColor: "#7dd3fc",
    overlayKind: "sticker",
    shadowStrength: 0.13,
  },
  {
    id: "neon-pop",
    name: "Neon Pop",
    description: "Soft neon glow on a candy-dark backdrop.",
    borderWidthRatio: 0.02,
    cornerRadiusRatio: 0.08,
    backgroundColor: "#12122b",
    borderColor: "#8af5ff",
    overlayKind: "neon",
    shadowStrength: 0.2,
  },
];

export const DEFAULT_FRAME_ID = FRAME_STYLES[0].id;

export const getFrameById = (id: string | null | undefined): FrameStyle => {
  const found = FRAME_STYLES.find((frame) => frame.id === id);
  return found ?? FRAME_STYLES[0];
};
