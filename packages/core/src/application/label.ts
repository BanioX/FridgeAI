import { CONTRACT_V1 } from '../contract/operations';
import { rankLabelHits, readLabel } from '../scan/label-reading';
import type { AppContext, UseCase } from './command';

/** How many catalogue products the label words are compared with. */
const CANDIDATES = 30;

/**
 * `products.fromLabel` (ADR-0068): what the text of a photographed pack says. The text was read on
 * the device and is searched only in the catalog shipped with the app, so nothing leaves the
 * phone; a barcode lookup happens only once the person picks a suggestion.
 */
export function createLabelUseCases({ clock, localSearch }: AppContext) {
  const fromLabel: UseCase<'products.fromLabel'> = async (raw) => {
    const input = CONTRACT_V1['products.fromLabel'].input.parse(raw);
    const reading = readLabel(input.text, clock.today());
    const hits =
      reading.query === '' || localSearch === undefined
        ? []
        : await localSearch.searchByName(reading.query, CANDIDATES);
    return {
      ...(reading.expiry === undefined
        ? {}
        : {
            expiresOn: reading.expiry.date,
            ...(reading.expiry.kind === undefined ? {} : { expiryKind: reading.expiry.kind }),
          }),
      ...(reading.amount === undefined ? {} : { amount: reading.amount }),
      ...(reading.categoryId === undefined ? {} : { categoryId: reading.categoryId }),
      suggestions: hits === 'unavailable' ? [] : rankLabelHits(reading.query, hits),
    };
  };

  return { 'products.fromLabel': fromLabel };
}
