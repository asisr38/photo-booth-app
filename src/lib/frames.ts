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
  | "party"
  | "hearts"
  | "film-strip"
  | "cat-whiskers"
  | "heart-chain"
  | "grid-glow";

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
    id: "cine-reel",
    name: "Cine Reel",
    description: "Modern 35mm-inspired strip with sprocket accents.",
    borderWidthRatio: 0.032,
    cornerRadiusRatio: 0.03,
    backgroundColor: "#11131d",
    borderColor: "#f0f4ff",
    overlayKind: "film-strip",
    shadowStrength: 0.16,
  },
  {
    id: "silver-screen",
    name: "Silver Screen",
    description: "Clean monochrome reel style for editorial portraits.",
    borderWidthRatio: 0.028,
    cornerRadiusRatio: 0.04,
    backgroundColor: "#f9fbff",
    borderColor: "#5f6f8c",
    overlayKind: "film-strip",
    shadowStrength: 0.1,
  },
  {
    id: "valentine",
    name: "Valentine",
    description: "Rosy blush border with floating hearts.",
    borderWidthRatio: 0.024,
    cornerRadiusRatio: 0.08,
    backgroundColor: "#fff1f5",
    borderColor: "#ff7aa2",
    overlayKind: "hearts",
    shadowStrength: 0.11,
  },
  {
    id: "heart-pop",
    name: "Heart Pop",
    description: "Contemporary candy-heart pattern with a bold rim.",
    borderWidthRatio: 0.028,
    cornerRadiusRatio: 0.08,
    backgroundColor: "#fff3f8",
    borderColor: "#ff5f8f",
    overlayKind: "heart-chain",
    shadowStrength: 0.12,
  },
  {
    id: "love-letter",
    name: "Love Letter",
    description: "Soft ivory with romantic heart accents.",
    borderWidthRatio: 0.02,
    cornerRadiusRatio: 0.06,
    backgroundColor: "#fff7f1",
    borderColor: "#ffb4c8",
    overlayKind: "hearts",
    shadowStrength: 0.1,
  },
  {
    id: "heart-link",
    name: "Heart Link",
    description: "Linked mini-hearts around the border for a soft kawaii vibe.",
    borderWidthRatio: 0.022,
    cornerRadiusRatio: 0.075,
    backgroundColor: "#fff8fb",
    borderColor: "#ff9aba",
    overlayKind: "heart-chain",
    shadowStrength: 0.11,
  },
  {
    id: "cat-cafe",
    name: "Cat Cafe",
    description: "Cute cat-ear top corners with whisker line accents.",
    borderWidthRatio: 0.026,
    cornerRadiusRatio: 0.085,
    backgroundColor: "#fff7ef",
    borderColor: "#d4a373",
    overlayKind: "cat-whiskers",
    shadowStrength: 0.12,
  },
  {
    id: "kitty-neon",
    name: "Kitty Neon",
    description: "Dark playful cat frame with modern cyan glow strokes.",
    borderWidthRatio: 0.024,
    cornerRadiusRatio: 0.09,
    backgroundColor: "#111425",
    borderColor: "#8fe8ff",
    overlayKind: "cat-whiskers",
    shadowStrength: 0.18,
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
  {
    id: "grid-glow",
    name: "Grid Glow",
    description: "Y2K-inspired chrome edge with a subtle glowing grid.",
    borderWidthRatio: 0.024,
    cornerRadiusRatio: 0.07,
    backgroundColor: "#ecf4ff",
    borderColor: "#7aa7ff",
    overlayKind: "grid-glow",
    shadowStrength: 0.14,
  },
];

export const DEFAULT_FRAME_ID = FRAME_STYLES[0].id;

export const getFrameById = (id: string | null | undefined): FrameStyle => {
  const found = FRAME_STYLES.find((frame) => frame.id === id);
  return found ?? FRAME_STYLES[0];
};
