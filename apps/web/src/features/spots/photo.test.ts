import { describe, expect, it } from 'vitest';
import { downscalePhoto, fitWithin, PhotoError } from './photo';

describe('fitWithin', () => {
  it('shrinks the longest side to 1280 and keeps the proportions', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 });
    expect(fitWithin(5000, 5000)).toEqual({ width: 1280, height: 1280 });
  });

  it('never enlarges a small photo', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1280, 720)).toEqual({ width: 1280, height: 720 });
  });

  it('keeps at least one pixel on a very thin picture', () => {
    expect(fitWithin(10_000, 3)).toEqual({ width: 1280, height: 1 });
  });

  it('takes another maximum', () => {
    expect(fitWithin(2000, 1000, 500)).toEqual({ width: 500, height: 250 });
  });
});

describe('downscalePhoto', () => {
  it('refuses a file that is no image', async () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    await expect(downscalePhoto(file)).rejects.toBeInstanceOf(PhotoError);
    await expect(downscalePhoto(file)).rejects.toMatchObject({ code: 'not_image' });
  });
});
