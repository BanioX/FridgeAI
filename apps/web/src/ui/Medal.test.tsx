import { cleanup, render, screen } from '@testing-library/react';
import { Sprout } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';
import { Medal } from './Medal';

describe('Medal', () => {
  afterEach(cleanup);

  const ringOf = (container: HTMLElement) => container.querySelector('circle');

  it('is 56 px round with the symbol at line 1.75 and says tier and day as one sentence', () => {
    const { container } = render(
      <Medal
        icon={Sprout}
        look="silver"
        name="Resteküche"
        label="Resteküche, Stufe I, freigeschaltet am 04.12.2026, noch 15 Reste"
        missing="noch 15 Reste"
      />,
    );
    expect(
      screen.getByRole('img', { name: /Resteküche, Stufe I, freigeschaltet am 04\.12\.2026/ }),
    ).toBeDefined();
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('56');
    expect(container.querySelector('svg.lucide')?.getAttribute('stroke-width')).toBe('1.75');
    expect(ringOf(container)?.getAttribute('stroke')).toBe('var(--color-silver)');
    expect(ringOf(container)?.getAttribute('stroke-dasharray')).toBeNull();
    // Progress is text, too.
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('noch 15 Reste');
  });

  it('draws tier II as a Smaragd ring on basil-50', () => {
    const { container } = render(
      <Medal icon={Sprout} look="emerald" name="Am Herd" label="Am Herd, Stufe II" />,
    );
    expect(ringOf(container)?.getAttribute('stroke')).toBe('var(--color-basil-700)');
    expect(ringOf(container)?.getAttribute('fill')).toBe('var(--color-basil-50)');
  });

  it('draws tier III Onyx filled with a white symbol', () => {
    const { container } = render(
      <Medal icon={Sprout} look="onyx" name="Am Herd" label="Am Herd, Stufe III" />,
    );
    expect(ringOf(container)?.getAttribute('fill')).toBe('var(--color-onyx)');
    expect(container.querySelector('span')?.className).toContain('text-white');
  });

  it('draws an open medal dashed, with a progress arc and the missing part as text', () => {
    const { container } = render(
      <Medal
        icon={Sprout}
        look="open"
        fraction={0.3}
        name="Rettungsdienst"
        label="Rettungsdienst, noch offen: noch 7 Rettungen"
        missing="noch 7 Rettungen"
      />,
    );
    expect(ringOf(container)?.getAttribute('stroke-dasharray')).toBe('3 4');
    expect(screen.getByTestId('medal-arc')).toBeDefined();
    expect(screen.getByText('noch 7 Rettungen')).toBeDefined();
    expect(container.querySelector('span')?.className).toContain('text-ink-muted');
  });

  it('draws no arc without progress', () => {
    render(<Medal icon={Sprout} look="open" fraction={0} name="x" label="x, noch offen" />);
    expect(screen.queryByTestId('medal-arc')).toBeNull();
  });
});
