import { describe, expect, it } from 'vitest';
import { fetchProductImage, MAX_IMAGE_BYTES } from './product-images';

const url = 'https://images.openfoodfacts.org/images/products/761/front_de.3.200.jpg';

function answer(body: Uint8Array, type: string, status = 200) {
  const seen: RequestInit[] = [];
  const fetchImage = (_target: string, init: RequestInit) => {
    seen.push(init);
    return Promise.resolve(new Response(body, { status, headers: { 'content-type': type } }));
  };
  return { fetchImage, seen };
}

describe('fetchProductImage', () => {
  it('returns a small JPEG as data URL, without cookies or referrer', async () => {
    const { fetchImage, seen } = answer(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), 'image/jpeg');
    expect(await fetchProductImage(url, fetchImage)).toBe('data:image/jpeg;base64,/9j/4A==');
    expect(seen[0]).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
  });

  it('refuses other types, big files, errors and network failures', async () => {
    const tiny = new Uint8Array([1, 2, 3]);
    expect(await fetchProductImage(url, answer(tiny, 'image/svg+xml').fetchImage)).toBeNull();
    expect(await fetchProductImage(url, answer(tiny, 'text/html').fetchImage)).toBeNull();
    expect(await fetchProductImage(url, answer(tiny, 'image/png', 404).fetchImage)).toBeNull();
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    expect(await fetchProductImage(url, answer(big, 'image/webp').fetchImage)).toBeNull();
    expect(await fetchProductImage(url, () => Promise.reject(new TypeError('offline')))).toBeNull();
  });
});
