import { FUJI_FRAME_ID, type FrameStyle } from "../frames";
import logoWordmark from "../../assets/logo/papersnap-wordmark.png";
import type { LayoutTemplate, SlotRect } from "../layouts";
import type { BoothShot } from "../../store/useBoothStore";

type RenderOptions = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  layout: LayoutTemplate;
  shots: BoothShot[];
  frame: FrameStyle;
  captionText: string;
  captionAlign?: "left" | "center" | "right";
  watermarkEnabled: boolean;
};

type LoadedImage = HTMLImageElement | ImageBitmap;

type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const FILTER_CSS_MAP: Record<string, string> = {
  none: "none",
  soft: "brightness(1.04) saturate(1.05)",
  warm: "saturate(1.12) sepia(0.18)",
  cool: "saturate(1.05) hue-rotate(335deg)",
  mono: "grayscale(1) contrast(1.06)",
  pop: "contrast(1.12) saturate(1.18)",
  vivid: "contrast(1.08) saturate(1.4) brightness(1.02)",
  fade: "contrast(0.88) saturate(0.75) brightness(1.08)",
};

const getFilterCssById = (filterId: string): string =>
  FILTER_CSS_MAP[filterId] ?? "none";

const createSeededRandom = (seed = 42) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const isDataUrl = (src: string): boolean => src.startsWith("data:");

const isBlobUrl = (src: string): boolean => src.startsWith("blob:");

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

const loadImage = async (src: string): Promise<LoadedImage> => {
  if ("createImageBitmap" in window && !isDataUrl(src) && !isBlobUrl(src)) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      return await createImageBitmap(blob);
    } catch (error) {
      return loadImageElement(src);
    }
  }

  return loadImageElement(src);
};

let watermarkImagePromise: Promise<LoadedImage | null> | null = null;
let watermarkImageCache: LoadedImage | null = null;

const getWatermarkImage = async (): Promise<LoadedImage | null> => {
  if (watermarkImageCache) {
    return watermarkImageCache;
  }
  if (!watermarkImagePromise) {
    watermarkImagePromise = loadImage(logoWordmark)
      .then((image) => {
        watermarkImageCache = image;
        return image;
      })
      .catch(() => null);
  }
  return watermarkImagePromise;
};

const drawRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number
) => {
  const r = clamp(radius, 0, Math.min(rect.w, rect.h) / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.arcTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h, r);
  ctx.arcTo(rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h, r);
  ctx.arcTo(rect.x, rect.y + rect.h, rect.x, rect.y, r);
  ctx.arcTo(rect.x, rect.y, rect.x + rect.w, rect.y, r);
  ctx.closePath();
};

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  image: LoadedImage,
  rect: Rect
) => {
  const isImageElement =
    typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement;
  const imageWidth = isImageElement ? image.naturalWidth || image.width : image.width;
  const imageHeight = isImageElement ? image.naturalHeight || image.height : image.height;
  if (!imageWidth || !imageHeight) {
    return;
  }
  const scale = Math.max(rect.w / imageWidth, rect.h / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const dx = rect.x - (drawWidth - rect.w) / 2;
  const dy = rect.y - (drawHeight - rect.h) / 2;
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
};

const addRoundedRectPath = (ctx: CanvasRenderingContext2D, rect: Rect, radius: number) => {
  const r = clamp(radius, 0, Math.min(rect.w, rect.h) / 2);
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, r);
    ctx.closePath();
    return;
  }
  drawRoundedRectPath(ctx, rect, r);
};

const mapSlotRect = (
  slot: SlotRect,
  contentRect: Rect,
  gap: number
): Rect => {
  const x = contentRect.x + slot.x * contentRect.w;
  const y = contentRect.y + slot.y * contentRect.h;
  const w = slot.w * contentRect.w;
  const h = slot.h * contentRect.h;
  const inset = gap * 0.5;
  return {
    x: x + inset,
    y: y + inset,
    w: Math.max(1, w - gap),
    h: Math.max(1, h - gap),
  };
};

const drawGoldOverlay = (ctx: CanvasRenderingContext2D, rect: Rect, radius: number) => {
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  gradient.addColorStop(0, "rgba(255, 240, 200, 0.45)");
  gradient.addColorStop(0.5, "rgba(210, 160, 60, 0.22)");
  gradient.addColorStop(1, "rgba(130, 90, 30, 0.35)");

  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
};

const drawBubblesOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number
) => {
  const rand = createSeededRandom(2024);
  const bubbleCount = 26;
  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();
  for (let i = 0; i < bubbleCount; i += 1) {
    const size = rect.w * (0.06 + rand() * 0.08);
    const x = rect.x + rand() * (rect.w - size);
    const y = rect.y + rand() * (rect.h - size);
    const hueShift = rand() > 0.5 ? "#ffffff" : "#ffd1e6";
    ctx.beginPath();
    ctx.fillStyle = hueShift;
    ctx.globalAlpha = 0.16 + rand() * 0.16;
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = Math.max(2, borderWidth * 0.22);
  drawRoundedRectPath(ctx, rect, radius);
  ctx.stroke();
  ctx.restore();
};

const drawSprinklesOverlay = (ctx: CanvasRenderingContext2D, rect: Rect) => {
  const rand = createSeededRandom(77);
  const colors = ["#ff8fab", "#ffd166", "#7bdff2", "#b8f2e6", "#cdb4db"];
  const sprinkleCount = 140;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(4, rect.w * 0.006);
  for (let i = 0; i < sprinkleCount; i += 1) {
    const edgeBias = rand() > 0.5 ? rand() * 0.18 : 0.82 + rand() * 0.18;
    const x = rect.x + rect.w * edgeBias;
    const y = rect.y + rect.h * (rand() * 0.2 + (rand() > 0.5 ? 0 : 0.8));
    const len = rect.w * (0.012 + rand() * 0.02);
    const angle = rand() * Math.PI;
    ctx.strokeStyle = colors[Math.floor(rand() * colors.length)];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
};

const drawSparkleOverlay = (ctx: CanvasRenderingContext2D, rect: Rect) => {
  const rand = createSeededRandom(909);
  const sparkleCount = 18;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < sparkleCount; i += 1) {
    const x = rect.x + rect.w * (0.1 + rand() * 0.8);
    const y = rect.y + rect.h * (0.1 + rand() * 0.8);
    const size = rect.w * (0.014 + rand() * 0.02);
    ctx.lineWidth = Math.max(2, size * 0.18);
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();
  }
  ctx.restore();
};

const drawRibbonOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number
) => {
  const tapeWidth = rect.w * 0.22;
  const tapeHeight = borderWidth * 0.9;
  const tapeY = rect.y + borderWidth * 0.6;
  const tapes = [
    { x: rect.x + rect.w * 0.14, rotate: -0.08 },
    { x: rect.x + rect.w * 0.64, rotate: 0.1 },
  ];

  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();
  tapes.forEach((tape) => {
    ctx.save();
    ctx.translate(tape.x + tapeWidth / 2, tapeY + tapeHeight / 2);
    ctx.rotate(tape.rotate);
    ctx.fillStyle = "rgba(255, 229, 180, 0.8)";
    ctx.strokeStyle = "rgba(182, 140, 80, 0.35)";
    ctx.lineWidth = Math.max(1, borderWidth * 0.08);
    addRoundedRectPath(
      ctx,
      { x: -tapeWidth / 2, y: -tapeHeight / 2, w: tapeWidth, h: tapeHeight },
      tapeHeight * 0.4
    );
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
};

const drawStickerOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number
) => {
  ctx.save();
  ctx.lineWidth = borderWidth * 0.4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  drawRoundedRectPath(ctx, rect, radius);
  ctx.stroke();
  ctx.setLineDash([borderWidth * 0.3, borderWidth * 0.28]);
  ctx.lineWidth = Math.max(2, borderWidth * 0.16);
  ctx.strokeStyle = "rgba(125, 211, 252, 0.8)";
  drawRoundedRectPath(ctx, rect, radius - borderWidth * 0.12);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

const drawVintageOverlay = (ctx: CanvasRenderingContext2D, rect: Rect) => {
  const vignette = ctx.createRadialGradient(
    rect.x + rect.w / 2,
    rect.y + rect.h / 2,
    rect.w * 0.2,
    rect.x + rect.w / 2,
    rect.y + rect.h / 2,
    rect.w * 0.8
  );
  vignette.addColorStop(0, "rgba(255, 255, 255, 0)");
  vignette.addColorStop(1, "rgba(120, 80, 40, 0.18)");

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = vignette;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  const rand = createSeededRandom(1337);
  const dots = 520;
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < dots; i += 1) {
    const px = rect.x + rand() * rect.w;
    const py = rect.y + rand() * rect.h;
    const size = rand() * 1.8 + 0.4;
    ctx.fillStyle = rand() > 0.5 ? "#8b5e34" : "#5c4033";
    ctx.fillRect(px, py, size, size);
  }
  ctx.restore();
};

const drawPartyOverlay = (ctx: CanvasRenderingContext2D, rect: Rect) => {
  const confetti = [
    { x: rect.x + rect.w * 0.06, y: rect.y + rect.h * 0.08, color: "#e76f51" },
    { x: rect.x + rect.w * 0.12, y: rect.y + rect.h * 0.12, color: "#f4a261" },
    { x: rect.x + rect.w * 0.9, y: rect.y + rect.h * 0.1, color: "#2a9d8f" },
    { x: rect.x + rect.w * 0.84, y: rect.y + rect.h * 0.16, color: "#e9c46a" },
    { x: rect.x + rect.w * 0.1, y: rect.y + rect.h * 0.9, color: "#457b9d" },
    { x: rect.x + rect.w * 0.18, y: rect.y + rect.h * 0.84, color: "#e63946" },
    { x: rect.x + rect.w * 0.88, y: rect.y + rect.h * 0.88, color: "#ffafcc" },
    { x: rect.x + rect.w * 0.82, y: rect.y + rect.h * 0.82, color: "#bde0fe" },
  ];

  ctx.save();
  ctx.globalAlpha = 0.8;
  confetti.forEach((dot, index) => {
    ctx.beginPath();
    ctx.fillStyle = dot.color;
    const radius = rect.w * (index % 2 === 0 ? 0.012 : 0.009);
    ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

const drawHeartPath = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  const topCurveHeight = size * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(
    x,
    y,
    x - size / 2,
    y,
    x - size / 2,
    y + topCurveHeight
  );
  ctx.bezierCurveTo(
    x - size / 2,
    y + (size + topCurveHeight) / 2,
    x,
    y + (size + topCurveHeight) / 2,
    x,
    y + size
  );
  ctx.bezierCurveTo(
    x,
    y + (size + topCurveHeight) / 2,
    x + size / 2,
    y + (size + topCurveHeight) / 2,
    x + size / 2,
    y + topCurveHeight
  );
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
};

const drawHeartsOverlay = (ctx: CanvasRenderingContext2D, rect: Rect) => {
  const rand = createSeededRandom(212);
  const heartCount = 18;
  const colors = ["#ff7aa2", "#ff9fc1", "#ffc1d6", "#ffd6e3"];

  ctx.save();
  drawRoundedRectPath(ctx, rect, Math.min(rect.w, rect.h) * 0.06);
  ctx.clip();

  for (let i = 0; i < heartCount; i += 1) {
    const size = rect.w * (0.035 + rand() * 0.04);
    const edgeBias = rand() > 0.5 ? rand() * 0.2 : 0.8 + rand() * 0.2;
    const x = rect.x + rect.w * edgeBias;
    const y = rect.y + rect.h * (rand() * 0.25 + (rand() > 0.5 ? 0 : 0.75));
    const color = colors[Math.floor(rand() * colors.length)];
    const rotation = (rand() - 0.5) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.55 + rand() * 0.25;
    drawHeartPath(ctx, 0, 0, size);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
};

const drawFilmStripOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number
) => {
  const stripHeight = Math.max(borderWidth * 0.95, rect.h * 0.052);
  const holeInset = Math.max(4, borderWidth * 0.35);
  const holeWidth = Math.max(5, borderWidth * 0.42);
  const holeHeight = Math.max(4, stripHeight * 0.44);
  const holeRadius = Math.max(2, holeHeight * 0.26);
  const holeCount = Math.max(8, Math.floor((rect.w - holeInset * 2) / (holeWidth * 1.8)));
  const spacing = holeCount > 1 ? (rect.w - holeInset * 2 - holeWidth) / (holeCount - 1) : 0;

  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();

  ctx.fillStyle = "rgba(8, 12, 25, 0.45)";
  ctx.fillRect(rect.x, rect.y, rect.w, stripHeight);
  ctx.fillRect(rect.x, rect.y + rect.h - stripHeight, rect.w, stripHeight);

  ctx.fillStyle = "rgba(242, 246, 255, 0.9)";
  for (let i = 0; i < holeCount; i += 1) {
    const x = rect.x + holeInset + i * spacing;
    addRoundedRectPath(
      ctx,
      {
        x,
        y: rect.y + (stripHeight - holeHeight) / 2,
        w: holeWidth,
        h: holeHeight,
      },
      holeRadius
    );
    ctx.fill();

    addRoundedRectPath(
      ctx,
      {
        x,
        y: rect.y + rect.h - stripHeight + (stripHeight - holeHeight) / 2,
        w: holeWidth,
        h: holeHeight,
      },
      holeRadius
    );
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(242, 246, 255, 0.26)";
  ctx.lineWidth = Math.max(1.5, borderWidth * 0.11);
  ctx.beginPath();
  ctx.moveTo(rect.x + borderWidth * 0.7, rect.y + stripHeight);
  ctx.lineTo(rect.x + rect.w - borderWidth * 0.7, rect.y + stripHeight);
  ctx.moveTo(rect.x + borderWidth * 0.7, rect.y + rect.h - stripHeight);
  ctx.lineTo(rect.x + rect.w - borderWidth * 0.7, rect.y + rect.h - stripHeight);
  ctx.stroke();

  ctx.restore();
};

const drawCatOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number,
  borderColor: string
) => {
  const earBase = Math.max(borderWidth * 2.05, rect.w * 0.12);
  const earHeight = earBase * 0.82;
  const leftEarX = rect.x + rect.w * 0.24;
  const rightEarX = rect.x + rect.w * 0.76;
  const earY = rect.y + borderWidth * 0.42;
  const whiskerY = rect.y + rect.h - borderWidth * 1.25;
  const noseY = whiskerY - borderWidth * 0.28;
  const whiskerHalf = rect.w * 0.17;

  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();

  const drawEar = (x: number) => {
    ctx.save();
    ctx.translate(x, earY);
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.moveTo(0, earHeight);
    ctx.lineTo(-earBase / 2, 0);
    ctx.lineTo(earBase / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 214, 228, 0.84)";
    ctx.beginPath();
    ctx.moveTo(0, earHeight * 0.72);
    ctx.lineTo(-earBase * 0.22, earHeight * 0.2);
    ctx.lineTo(earBase * 0.22, earHeight * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawEar(leftEarX);
  drawEar(rightEarX);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = Math.max(2, borderWidth * 0.12);
  ctx.lineCap = "round";

  const drawWhiskers = (centerX: number, direction: -1 | 1) => {
    const offsets = [-borderWidth * 0.35, 0, borderWidth * 0.35];
    offsets.forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(centerX, whiskerY + offset);
      ctx.lineTo(centerX + whiskerHalf * direction, whiskerY + offset + direction * borderWidth * 0.06);
      ctx.stroke();
    });
  };

  drawWhiskers(rect.x + rect.w * 0.42, -1);
  drawWhiskers(rect.x + rect.w * 0.58, 1);

  ctx.fillStyle = "rgba(255, 160, 182, 0.95)";
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w / 2, noseY + borderWidth * 0.18);
  ctx.lineTo(rect.x + rect.w / 2 - borderWidth * 0.24, noseY - borderWidth * 0.14);
  ctx.lineTo(rect.x + rect.w / 2 + borderWidth * 0.24, noseY - borderWidth * 0.14);
  ctx.closePath();
  ctx.fill();

  const pawDots = [
    { x: rect.x + rect.w * 0.12, y: rect.y + rect.h * 0.16 },
    { x: rect.x + rect.w * 0.9, y: rect.y + rect.h * 0.22 },
    { x: rect.x + rect.w * 0.16, y: rect.y + rect.h * 0.84 },
    { x: rect.x + rect.w * 0.84, y: rect.y + rect.h * 0.86 },
  ];
  ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
  pawDots.forEach((dot) => {
    const size = borderWidth * 0.14;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
    ctx.arc(dot.x - size * 1.5, dot.y - size * 1.2, size * 0.52, 0, Math.PI * 2);
    ctx.arc(dot.x - size * 0.4, dot.y - size * 1.65, size * 0.48, 0, Math.PI * 2);
    ctx.arc(dot.x + size * 0.7, dot.y - size * 1.55, size * 0.46, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
};

const drawHeartChainOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number
) => {
  const size = Math.max(rect.w * 0.024, borderWidth * 0.42);
  const topY = rect.y + borderWidth * 0.42;
  const bottomY = rect.y + rect.h - borderWidth * 1.25;
  const sideInset = borderWidth * 0.85;
  const count = Math.max(8, Math.floor((rect.w - sideInset * 2) / (size * 1.95)));
  const spacing = count > 1 ? (rect.w - sideInset * 2) / (count - 1) : 0;
  const colors = ["#ff8db4", "#ffb0c8", "#ffc2d6"];

  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();

  for (let i = 0; i < count; i += 1) {
    const x = rect.x + sideInset + spacing * i;
    const color = colors[i % colors.length];
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    drawHeartPath(ctx, x, topY, size);
    ctx.fill();
    drawHeartPath(ctx, x, bottomY, size);
    ctx.fill();
  }

  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = Math.max(1.2, borderWidth * 0.07);
  ctx.beginPath();
  ctx.moveTo(rect.x + sideInset, topY + size * 0.32);
  ctx.lineTo(rect.x + rect.w - sideInset, topY + size * 0.32);
  ctx.moveTo(rect.x + sideInset, bottomY + size * 0.32);
  ctx.lineTo(rect.x + rect.w - sideInset, bottomY + size * 0.32);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
};

const drawGridGlowOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number,
  borderColor: string
) => {
  const spacing = Math.max(12, rect.w * 0.06);
  const innerRect = {
    x: rect.x + borderWidth * 0.7,
    y: rect.y + borderWidth * 0.7,
    w: rect.w - borderWidth * 1.4,
    h: rect.h - borderWidth * 1.4,
  };

  ctx.save();
  drawRoundedRectPath(ctx, rect, radius);
  ctx.clip();

  const glow = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  glow.addColorStop(0, "rgba(90, 200, 255, 0.26)");
  glow.addColorStop(0.5, "rgba(122, 167, 255, 0.12)");
  glow.addColorStop(1, "rgba(255, 123, 176, 0.22)");
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  ctx.strokeStyle = "rgba(122, 167, 255, 0.26)";
  ctx.lineWidth = Math.max(1, borderWidth * 0.055);
  for (let x = innerRect.x; x <= innerRect.x + innerRect.w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, innerRect.y);
    ctx.lineTo(x, innerRect.y + innerRect.h);
    ctx.stroke();
  }
  for (let y = innerRect.y; y <= innerRect.y + innerRect.h; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(innerRect.x, y);
    ctx.lineTo(innerRect.x + innerRect.w, y);
    ctx.stroke();
  }

  ctx.shadowColor = borderColor;
  ctx.shadowBlur = borderWidth * 1.9;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = Math.max(2, borderWidth * 0.24);
  drawRoundedRectPath(ctx, innerRect, Math.max(6, radius - borderWidth));
  ctx.stroke();
  ctx.restore();
};

const drawNeonOverlay = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  borderWidth: number,
  borderColor: string
) => {
  ctx.save();
  ctx.shadowColor = borderColor;
  ctx.shadowBlur = borderWidth * 2.8;
  ctx.lineWidth = borderWidth * 0.75;
  ctx.strokeStyle = borderColor;
  drawRoundedRectPath(ctx, rect, radius);
  ctx.stroke();
  ctx.restore();
};

const drawCaption = (
  ctx: CanvasRenderingContext2D,
  outerRect: Rect,
  borderWidth: number,
  captionText: string,
  captionAlign: "left" | "center" | "right" = "center"
) => {
  if (!captionText.trim()) {
    return;
  }
  const fontSize = Math.max(18, borderWidth * 1.8);
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.font = `600 ${fontSize}px "Cormorant Garamond", "Times New Roman", serif`;
  ctx.textAlign = captionAlign;
  ctx.textBaseline = "bottom";
  const padding = borderWidth * 1.6;
  const textX =
    captionAlign === "left"
      ? outerRect.x + padding
      : captionAlign === "right"
        ? outerRect.x + outerRect.w - padding
        : outerRect.x + outerRect.w / 2;
  ctx.fillText(captionText.trim(), textX, outerRect.y + outerRect.h - borderWidth * 1.4);
  ctx.restore();
};

const drawWatermark = async (
  ctx: CanvasRenderingContext2D,
  outerRect: Rect,
  borderWidth: number,
  enabled: boolean
): Promise<void> => {
  if (!enabled) {
    return;
  }

  const image = await getWatermarkImage();
  if (image) {
    const imageWidth =
      image instanceof HTMLImageElement ? image.naturalWidth || image.width : image.width;
    const imageHeight =
      image instanceof HTMLImageElement ? image.naturalHeight || image.height : image.height;
    if (imageWidth && imageHeight) {
      const maxWidth = outerRect.w * 0.34;
      const targetHeight = Math.max(14, borderWidth * 1.4);
      let drawHeight = targetHeight;
      let drawWidth = (imageWidth / imageHeight) * drawHeight;
      if (drawWidth > maxWidth) {
        drawWidth = maxWidth;
        drawHeight = (imageHeight / imageWidth) * drawWidth;
      }
      const x = outerRect.x + outerRect.w - borderWidth * 1.2 - drawWidth;
      const y = outerRect.y + outerRect.h - borderWidth * 0.7 - drawHeight;
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.drawImage(image, x, y, drawWidth, drawHeight);
      ctx.restore();
      return;
    }
  }

  const fontSize = Math.max(16, borderWidth * 1.5);
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
  ctx.font = `700 ${fontSize}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(
    "PaperSnap",
    outerRect.x + outerRect.w - borderWidth * 1.4,
    outerRect.y + outerRect.h - borderWidth * 0.8
  );
  ctx.restore();
};

export const renderComposition = async ({
  ctx,
  width,
  height,
  layout,
  shots,
  frame,
  captionText,
  captionAlign = "center",
  watermarkEnabled,
}: RenderOptions): Promise<void> => {
  const minDim = Math.min(width, height);
  const borderWidth = Math.max(8, minDim * frame.borderWidthRatio);
  const radius = minDim * frame.cornerRadiusRatio;
  const paddingX = borderWidth * 1.45;
  const isInstantFrame = frame.id === "polaroid" || frame.id === FUJI_FRAME_ID;
  const paddingTop = isInstantFrame ? paddingX * 1.12 : paddingX * 1.06;
  const paddingBottom = isInstantFrame ? paddingX * 3.25 : paddingX * 2.35;
  const gap = Math.max(6, minDim * 0.016);

  const outerRect: Rect = { x: 0, y: 0, w: width, h: height };
  const contentRect: Rect = {
    x: paddingX,
    y: paddingTop,
    w: width - paddingX * 2,
    h: height - paddingTop - paddingBottom,
  };

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = frame.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
  ctx.shadowBlur = minDim * frame.shadowStrength;
  ctx.shadowOffsetY = minDim * 0.02;
  ctx.fillStyle = frame.backgroundColor;
  drawRoundedRectPath(ctx, outerRect, radius);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const innerRadius = Math.max(6, radius - borderWidth * 0.6);
  drawRoundedRectPath(ctx, contentRect, innerRadius);
  ctx.clip();

  const shadeColor =
    frame.overlayKind === "neon" || frame.overlayKind === "film-strip"
      ? "#06070f"
      : frame.overlayKind === "grid-glow"
        ? "#0a1a3a"
        : "#0f172a";
  const shadeAlpha =
    frame.overlayKind === "neon"
      ? 0.42
      : frame.overlayKind === "film-strip"
        ? 0.16
        : frame.overlayKind === "grid-glow"
          ? 0.12
      : frame.overlayKind === "bubbles" || frame.overlayKind === "sparkle"
        ? 0.04
        : frame.overlayKind === "cat-whiskers" || frame.overlayKind === "heart-chain"
          ? 0.03
        : 0.06;
  ctx.fillStyle = shadeColor;
  ctx.globalAlpha = shadeAlpha;
  ctx.fillRect(contentRect.x, contentRect.y, contentRect.w, contentRect.h);
  ctx.globalAlpha = 1;

  const shotsBySlot = new Map<number, BoothShot>();
  shots.forEach((shot) => shotsBySlot.set(shot.slotIndex, shot));

  const slotImages = await Promise.all(
    layout.slotRects.map(async (slotRect, index) => {
      const shot = shotsBySlot.get(index);
      if (!shot) {
        return null;
      }
      const image = await loadImage(shot.dataUrl);
      return { image, slotRect, index };
    })
  );

  slotImages.forEach((entry) => {
    if (!entry) {
      return;
    }
    const rect = mapSlotRect(entry.slotRect, contentRect, gap);
    const shot = shotsBySlot.get(entry.index);
    const slotFilter = shot?.filterId && shot.filterId !== "none"
      ? getFilterCssById(shot.filterId)
      : "none";

    ctx.save();
    drawRoundedRectPath(ctx, rect, innerRadius * 0.5);
    ctx.clip();
    if (slotFilter !== "none") {
      ctx.filter = slotFilter;
    }
    drawImageCover(ctx, entry.image, rect);
    ctx.filter = "none";
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
    ctx.lineWidth = Math.max(2, borderWidth * 0.2);
    drawRoundedRectPath(ctx, rect, innerRadius * 0.5);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();

  ctx.save();
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = frame.borderColor;
  drawRoundedRectPath(ctx, outerRect, radius);
  ctx.stroke();
  ctx.restore();

  if (frame.overlayKind === "gold") {
    drawGoldOverlay(ctx, outerRect, radius);
  } else if (frame.overlayKind === "vintage") {
    drawVintageOverlay(ctx, outerRect);
  } else if (frame.overlayKind === "party") {
    drawPartyOverlay(ctx, outerRect);
  } else if (frame.overlayKind === "bubbles") {
    drawBubblesOverlay(ctx, outerRect, radius, borderWidth);
  } else if (frame.overlayKind === "sprinkles") {
    drawSprinklesOverlay(ctx, outerRect);
  } else if (frame.overlayKind === "sparkle") {
    drawSparkleOverlay(ctx, outerRect);
  } else if (frame.overlayKind === "ribbon") {
    drawRibbonOverlay(ctx, outerRect, radius, borderWidth);
  } else if (frame.overlayKind === "sticker") {
    drawStickerOverlay(ctx, outerRect, radius, borderWidth);
  } else if (frame.overlayKind === "hearts") {
    drawHeartsOverlay(ctx, outerRect);
  } else if (frame.overlayKind === "film-strip") {
    drawFilmStripOverlay(ctx, outerRect, radius, borderWidth);
  } else if (frame.overlayKind === "cat-whiskers") {
    drawCatOverlay(ctx, outerRect, radius, borderWidth, frame.borderColor);
  } else if (frame.overlayKind === "heart-chain") {
    drawHeartChainOverlay(ctx, outerRect, radius, borderWidth);
  } else if (frame.overlayKind === "grid-glow") {
    drawGridGlowOverlay(ctx, outerRect, radius, borderWidth, frame.borderColor);
  } else if (frame.overlayKind === "neon") {
    drawNeonOverlay(ctx, outerRect, radius, borderWidth, frame.borderColor);
  }

  drawCaption(ctx, outerRect, borderWidth, captionText, captionAlign);
  await drawWatermark(ctx, outerRect, borderWidth, watermarkEnabled);
};
