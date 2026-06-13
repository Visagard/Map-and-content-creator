// Sdílené bitmapy pro Konva. Každé emoji se vyrenderuje do canvasu JEN JEDNOU
// a všechny jeho instance na mapě (stovky stromů) sdílí tentýž obrázek → 1 dekódování.
const emojiCache = new Map<string, HTMLCanvasElement>();

const EMOJI_FONT =
  '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

export function getEmojiCanvas(emoji: string, px = 224): HTMLCanvasElement {
  const key = `${emoji}@${px}`;
  const hit = emojiCache.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, px, px);
  ctx.font = `${Math.floor(px * 0.78)}px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, px / 2, px / 2 + px * 0.06);

  emojiCache.set(key, canvas);
  return canvas;
}
