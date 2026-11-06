/**
 * Ports: the only way pure core logic talks to the outside world (ADR-0003, plan section 2).
 * Apps provide adapters (browser camera, tesseract.js, IndexedDB, Open Food Facts, backend …);
 * tests and the MVP use mocks. Types here stay free of DOM and Node APIs.
 */
import type { Id } from '../ids';
import type { Rappen } from '../money';
import type { Nutrition } from '../model/inventory';
import type { CategoryId, Gtin, IsoDateTime, LocalDate, Retailer } from '../model/primitives';
import type { Recipe } from '../recipes/recipe';

/** Cooperative cancellation without DOM/Node AbortSignal types. */
export interface CancelCheck {
  isCancelled: () => boolean;
}

// --- Time and identity -------------------------------------------------------------------

export interface Clock {
  /** Current instant, ISO 8601 UTC. */
  now: () => IsoDateTime;
  /** Current calendar day in Europe/Zurich. */
  today: () => LocalDate;
}

export interface IdGenerator {
  next: () => Id;
}

// --- Capturing ---------------------------------------------------------------------------

export interface OcrLine {
  text: string;
  /** 0 … 1 */
  confidence: number;
}

/** Reads text from a receipt or label image. `TImage` is the platform's image type. */
export interface ReceiptOcrEngine<TImage> {
  recognize: (
    image: TImage,
    options?: { onProgress?: (fraction: number) => void; cancel?: CancelCheck },
  ) => Promise<OcrLine[]>;
}

export type BarcodeFormat =
  'ean_13' | 'ean_8' | 'upc_a' | 'upc_e' | 'code_128' | 'data_matrix' | 'qr_code';

/** Scans codes from a video source until stopped; reports the raw text (see `parseScannedCode`). */
export interface BarcodeScanner<TSource> {
  start: (
    source: TSource,
    onCode: (raw: string, format: BarcodeFormat) => void,
  ) => Promise<{ stop: () => void }>;
}

// --- Product data ------------------------------------------------------------------------

export interface ProductInfo {
  gtin: Gtin;
  name: string;
  brand?: string;
  packSize?: string;
  /** Free-text category hints from the source (e.g. Open Food Facts tags), mapped in core. */
  categoryHints?: string[];
  nutrition?: Nutrition;
  nutriScore?: 'a' | 'b' | 'c' | 'd' | 'e';
  allergens?: string[];
  /** Front picture of the pack (Open Food Facts: CC BY-SA), downloaded once and kept locally. */
  imageUrl?: string;
  source: 'off' | 'openfoodrepo' | 'partner';
}

export interface ProductCatalog {
  lookupByGtin: (gtin: Gtin) => Promise<ProductInfo | null>;
}

/** Asks several catalogs in order (cache → Open Food Facts → Open Food Repo …), first hit wins. */
export function chainCatalogs(catalogs: readonly ProductCatalog[]): ProductCatalog {
  return {
    async lookupByGtin(gtin) {
      for (const catalog of catalogs) {
        const found = await catalog.lookupByGtin(gtin);
        if (found !== null) {
          return found;
        }
      }
      return null;
    },
  };
}

// --- Recipes -----------------------------------------------------------------------------

/** Source of candidate recipes; ranking by expiring food happens in core (step 11b). */
export interface RecipeProvider {
  recipes: () => Promise<readonly Recipe[]>;
}

// --- Partners (Vision; MVP uses mocks only, see brief §0.4) --------------------------------

export interface RebuyOffer {
  partnerId: string;
  title: string;
  priceRappen: Rappen;
  url: string;
}

/** «Milch ist aufgebraucht – nachkaufen?» */
export interface RebuyProvider {
  offers: (
    items: { name: string; gtin?: Gtin; categoryId?: CategoryId }[],
  ) => Promise<RebuyOffer[]>;
}

/** Shopping list → basket at a delivery service. */
export interface DeliveryProvider {
  createBasket: (
    lines: { name: string; quantity: number; gtin?: Gtin }[],
  ) => Promise<{ partnerId: string; checkoutUrl: string; totalRappen?: Rappen }>;
}

export interface RetailerReceipt {
  retailer: Retailer;
  purchasedAt: IsoDateTime;
  totalRappen: Rappen;
  lines: { text: string; quantity: number; priceRappen: Rappen; gtin?: Gtin }[];
}

/** Receipts delivered by a retailer account instead of a photo or file upload. */
export interface RetailerReceiptSource {
  receiptsSince: (since: IsoDateTime) => Promise<RetailerReceipt[]>;
}

// --- Sync and notifications --------------------------------------------------------------

/** One field-level change, ordered by a hybrid logical clock (details: ADR in step 7). */
export interface FieldChange {
  commandId: Id;
  entity: string;
  entityId: Id;
  field: string;
  value: unknown;
  hlc: string;
}

export interface SyncAdapter {
  push: (changes: readonly FieldChange[]) => Promise<{ accepted: number }>;
  pull: (cursor: string | null) => Promise<{ changes: FieldChange[]; cursor: string }>;
}

export type NotificationPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface NotificationService {
  permission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<NotificationPermission>;
  show: (notification: { title: string; body: string; tag: string }) => Promise<void>;
}
