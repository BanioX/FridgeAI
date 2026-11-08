import type { PdfPictures } from './pdf-kit';

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function canvas(size: number): CanvasRenderingContext2D | null {
  const element = document.createElement('canvas');
  element.width = size;
  element.height = size;
  return element.getContext('2d');
}

/** The app icon (`/icon.svg`, kept offline by the service worker) as PNG. */
async function logo(): Promise<string | undefined> {
  const context = canvas(256);
  if (context === null) {
    return undefined;
  }
  try {
    const image = new Image();
    image.src = '/icon.svg';
    await image.decode();
    context.drawImage(image, 0, 0, 256, 256);
    return context.canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

/** Draws each emoji once with the device's emoji font, so the PDF shows the app's pictures. */
function emojiPainter(): PdfPictures['emoji'] {
  const context = canvas(96);
  if (context === null) {
    return undefined;
  }
  const cache = new Map<string, string>();
  return (value) => {
    let dataUrl = cache.get(value);
    if (dataUrl === undefined) {
      context.clearRect(0, 0, 96, 96);
      context.font = `80px ${EMOJI_FONT}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(value, 48, 52);
      dataUrl = context.canvas.toDataURL('image/png');
      cache.set(value, dataUrl);
    }
    return dataUrl;
  };
}

/**
 * The pictures for the PDF report (ADR-0030), drawn on the device: the app icon and the food
 * emoji exactly as the app shows them. Nothing is loaded from the network. Without a canvas
 * the report draws without them.
 */
export async function loadPdfPictures(): Promise<PdfPictures> {
  const emoji = emojiPainter();
  const icon = await logo();
  return {
    ...(icon === undefined ? {} : { logo: icon }),
    ...(emoji === undefined ? {} : { emoji }),
  };
}
