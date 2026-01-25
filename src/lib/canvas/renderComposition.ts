import type { FrameStyle } from "../frames";
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

const createSeededRandom = (seed = 42) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const loadImage = async (src: string): Promise<LoadedImage> => {
  if ("createImageBitmap" in window) {
    const response = await fetch(src);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
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
  const imageWidth = (image as HTMLImageElement | ImageBitmap).width;
  const imageHeight = (image as HTMLImageElement | ImageBitmap).height;
  const scale = Math.max(rect.w / imageWidth, rect.h / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const dx = rect.x - (drawWidth - rect.w) / 2;
  const dy = rect.y - (drawHeight - rect.h) / 2;
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
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
    ctx.beginPath();
    ctx.roundRect(-tapeWidth / 2, -tapeHeight / 2, tapeWidth, tapeHeight, tapeHeight * 0.4);
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
  captionText: string
) => {
  if (!captionText.trim()) {
    return;
  }
  const fontSize = Math.max(18, borderWidth * 1.8);
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.font = `600 ${fontSize}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(captionText.trim(), outerRect.x + outerRect.w / 2, outerRect.y + outerRect.h - borderWidth * 1.6);
  ctx.restore();
};

const drawWatermark = (
  ctx: CanvasRenderingContext2D,
  outerRect: Rect,
  borderWidth: number,
  enabled: boolean
) => {
  if (!enabled) {
    return;
  }
  const fontSize = Math.max(16, borderWidth * 1.5);
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.55)";
  ctx.font = `700 ${fontSize}px Manrope, system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("Paper Snap", outerRect.x + outerRect.w - borderWidth * 1.4, outerRect.y + outerRect.h - borderWidth * 0.8);
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
  watermarkEnabled,
}: RenderOptions): Promise<void> => {
  const minDim = Math.min(width, height);
  const borderWidth = Math.max(8, minDim * frame.borderWidthRatio);
  const radius = minDim * frame.cornerRadiusRatio;
  const paddingX = borderWidth * 1.45;
  const paddingTop = frame.id === "polaroid" ? paddingX * 1.12 : paddingX * 1.06;
  const paddingBottom = frame.id === "polaroid" ? paddingX * 2.7 : paddingX * 1.95;
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

  const shadeColor = frame.overlayKind === "neon" ? "#06070f" : "#0f172a";
  const shadeAlpha =
    frame.overlayKind === "neon"
      ? 0.42
      : frame.overlayKind === "bubbles" || frame.overlayKind === "sparkle"
        ? 0.04
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
    ctx.save();
    drawRoundedRectPath(ctx, rect, innerRadius * 0.5);
    ctx.clip();
    drawImageCover(ctx, entry.image, rect);
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
  } else if (frame.overlayKind === "neon") {
    drawNeonOverlay(ctx, outerRect, radius, borderWidth, frame.borderColor);
  }

  drawCaption(ctx, outerRect, borderWidth, captionText);
  drawWatermark(ctx, outerRect, borderWidth, watermarkEnabled);
};
