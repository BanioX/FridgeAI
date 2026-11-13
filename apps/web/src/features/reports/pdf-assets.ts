import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { CATEGORY_ICONS } from '../../ui/food-icon-nodes';
import type { PdfPictures } from './pdf-kit';

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

/** The SVG of a picture as the app draws it, via a detached React root. */
function svgOf(icon: (typeof CATEGORY_ICONS)[string]): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => {
    root.render(createElement(icon, { size: 96, strokeWidth: 1.75, color: '#14161a' }));
  });
  const markup = host.innerHTML;
  root.unmount();
  return markup;
}

/** Size of one picture on the canvas: sharp at 7 mm in print. */
const FOOD_PX = 192;

/**
 * Draws the food picture of every category once (ADR-0080): the app's line icon in Onyx on its
 * silver tile, on white, as an opaque JPEG. The same picture is shared by all categories that use
 * it. Without a canvas the report draws without pictures.
 */
async function foodPainter(): Promise<PdfPictures['food']> {
  const context = canvas(FOOD_PX);
  if (context === null) {
    return undefined;
  }
  const byIcon = new Map<(typeof CATEGORY_ICONS)[string], string>();
  const byCategory = new Map<string, string>();
  try {
    for (const [categoryId, icon] of Object.entries(CATEGORY_ICONS)) {
      let dataUrl = byIcon.get(icon);
      if (dataUrl === undefined) {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgOf(icon))}`;
        await image.decode();
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, FOOD_PX, FOOD_PX);
        context.fillStyle = '#e9ebed';
        context.beginPath();
        context.roundRect(0, 0, FOOD_PX, FOOD_PX, FOOD_PX * 0.28);
        context.fill();
        context.drawImage(image, FOOD_PX * 0.2, FOOD_PX * 0.2, FOOD_PX * 0.6, FOOD_PX * 0.6);
        dataUrl = context.canvas.toDataURL('image/jpeg', 0.92);
        byIcon.set(icon, dataUrl);
      }
      byCategory.set(categoryId, dataUrl);
    }
  } catch {
    return undefined;
  }
  return (categoryId) => byCategory.get(categoryId);
}

/**
 * The pictures for the PDF report (ADR-0030), drawn on the device: the app icon and the food
 * pictures exactly as the app shows them. Nothing is loaded from the network. Without a canvas
 * the report draws without them.
 */
export async function loadPdfPictures(): Promise<PdfPictures> {
  const [food, icon] = await Promise.all([foodPainter(), logo()]);
  return {
    ...(icon === undefined ? {} : { logo: icon }),
    ...(food === undefined ? {} : { food }),
  };
}
