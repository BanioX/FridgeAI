import { canBeRescued, shouldAskStillGood, type LocalDate } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';

type Settleable = Parameters<typeof canBeRescued>[0];

/** What the selection needs before it is settled with «Verwertet» or «Entsorgt». */
export function planOutcome<T extends Settleable>(
  items: readonly T[],
  outcome: 'eaten' | 'wasted',
  today: LocalDate,
): {
  /** «Ohne Rettich im Abfall gelandet?» is asked once for these (ADR-0039); never for waste. */
  rescueQuestion: T[];
  /** The calm hint «Ist das noch gut?» belongs in the toast of thrown-away best-before food. */
  askStillGood: boolean;
} {
  return {
    rescueQuestion: outcome === 'eaten' ? items.filter((item) => canBeRescued(item, today)) : [],
    askStillGood: outcome === 'wasted' && items.some((item) => shouldAskStillGood(item)),
  };
}

/** «Joghurt verwertet.» for one item, «3 Artikel verwertet.» for several. */
export function outcomeText(names: readonly string[], outcome: 'eaten' | 'wasted'): string {
  const t = messages.inventory.settle;
  const [only] = names;
  return names.length === 1 && only !== undefined
    ? t.doneOne(only, outcome)
    : t.doneMany(names.length, outcome);
}

/** The status line after «Nachkaufen»: what was added and what was on the list already. */
export function rebuyText(added: readonly string[], already: readonly string[]): string {
  const t = messages.inventory.settle;
  const [addedOne] = added;
  const [alreadyOne] = already;
  const addedText =
    added.length === 0
      ? ''
      : added.length === 1 && addedOne !== undefined
        ? t.rebuyOne(addedOne)
        : t.rebuyMany(added.length);
  const alreadyText =
    already.length === 0
      ? ''
      : already.length === 1 && alreadyOne !== undefined
        ? t.rebuyAlreadyOne(alreadyOne)
        : t.rebuyAlreadyMany(already.length);
  return [addedText, alreadyText].filter((part) => part !== '').join(' ');
}
