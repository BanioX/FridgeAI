import { jsPDF } from 'jspdf';
import { describe, expect, it, vi } from 'vitest';
import { niceTicks, ring, type Rgb } from './pdf-kit';

describe('niceTicks', () => {
  it('rounds the axis to steps of 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceTicks(1210, 3)).toEqual([0, 500, 1000, 1500]);
    expect(niceTicks(90, 3)).toEqual([0, 50, 100]);
    expect(niceTicks(7, 3)).toEqual([0, 2.5, 5, 7.5]);
    expect(niceTicks(300, 3)).toEqual([0, 100, 200, 300]);
  });

  it('keeps an axis for an empty chart', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

describe('ring', () => {
  const track: Rgb = [43, 47, 52];
  const fill: Rgb = [89, 168, 132];

  it("draws the track, then the share clockwise from 12 o'clock", () => {
    const doc = new jsPDF({ unit: 'mm' });
    const lines = vi.spyOn(doc, 'lines');
    ring(doc, { x: 50, y: 50 }, 14, 3.8, 0.75, track, fill);
    expect(lines).toHaveBeenCalledTimes(2);
    const [segments, x, y] = lines.mock.calls[1] ?? [];
    expect([x, y]).toEqual([50, 36]);
    // Three quarters end at 9 o'clock.
    const end = (segments as number[][]).reduce(
      (point, [dx = 0, dy = 0]) => ({ x: point.x + dx, y: point.y + dy }),
      { x: 50, y: 36 },
    );
    expect(end.x).toBeCloseTo(36, 5);
    expect(end.y).toBeCloseTo(50, 5);
  });

  it('draws only the track without a share', () => {
    const doc = new jsPDF({ unit: 'mm' });
    const lines = vi.spyOn(doc, 'lines');
    ring(doc, { x: 50, y: 50 }, 14, 3.8, null, track, fill);
    ring(doc, { x: 50, y: 50 }, 14, 3.8, 0, track, fill);
    expect(lines).toHaveBeenCalledTimes(2);
  });
});
