import { describe, expect, it } from 'vitest';
import { doneCount, isComplete, nextIncomplete, nutritionFacts, stepsDone } from './receipt-steps';

describe('stepsDone', () => {
  it('counts place and price as done from the start', () => {
    const done = stepsDone({ asksProduct: true, productConfirmed: false, datePicked: false });
    expect(done).toEqual({ product: false, date: false, place: true, price: true });
    expect(doneCount(done)).toBe(2);
  });

  it('needs «Ja» or a scan for packed food, and a picked date', () => {
    const done = stepsDone({ asksProduct: true, productConfirmed: true, datePicked: false });
    expect(done.product).toBe(true);
    expect(isComplete(done)).toBe(false);
    expect(
      isComplete(stepsDone({ asksProduct: true, productConfirmed: true, datePicked: true })),
    ).toBe(true);
  });

  it('does not ask loose produce for a product', () => {
    const done = stepsDone({ asksProduct: false, productConfirmed: false, datePicked: true });
    expect(isComplete(done)).toBe(true);
  });
});

describe('nextIncomplete', () => {
  const order = [1, 3, 4, 7];
  it('picks the next incomplete card after the current one', () => {
    expect(nextIncomplete(order, 1, (index) => index === 3)).toBe(4);
  });
  it('wraps around to an earlier incomplete card', () => {
    expect(nextIncomplete(order, 7, (index) => index !== 3)).toBe(3);
  });
  it('starts at the first incomplete card without a current one', () => {
    expect(nextIncomplete(order, null, (index) => index === 1)).toBe(3);
  });
  it('is null when everything is complete or only the current one is left', () => {
    expect(nextIncomplete(order, 3, () => true)).toBeNull();
    expect(nextIncomplete(order, 3, (index) => index !== 3)).toBeNull();
  });
});

describe('nutritionFacts', () => {
  it('lists the known key values, rounded', () => {
    expect(
      nutritionFacts({
        basis: '100g',
        energyKcal: 92.4,
        fat: 2.96,
        sugars: 12,
        salt: 0.11,
        source: 'off',
      }),
    ).toEqual({
      basis: '100g',
      values: [
        { key: 'kcal', text: '92' },
        { key: 'fat', text: '3' },
        { key: 'sugars', text: '12' },
        { key: 'salt', text: '0.1' },
      ],
    });
  });
  it('is null without any of them', () => {
    expect(nutritionFacts(undefined)).toBeNull();
    expect(nutritionFacts({ basis: '100g', protein: 5, source: 'off' })).toBeNull();
  });
});
