type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** Pack pictures are small (Open Food Facts «small» is 200 px wide); anything bigger is refused. */
export const MAX_IMAGE_BYTES = 300_000;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

/**
 * Downloads a product picture once (step 10b) and returns it as a data URL to keep on the device:
 * no cookies, no referrer, a few seconds at most, only JPEG, PNG or WebP below 300 KB. Any
 * failure means «no picture», never an error for the person.
 */
export async function fetchProductImage(
  url: string,
  fetchImage: Fetch = (target, init) => fetch(target, init),
  timeoutMs = 8000,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetchImage(url, {
      signal: controller.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
    if (!response.ok || !IMAGE_TYPES.has(type)) {
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
      return null;
    }
    return `data:${type};base64,${toBase64(bytes)}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
