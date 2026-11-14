import { adviseFreezing, type FreezeAdvice, type FreezeCandidate } from '@fridgeai/core';
import { Snowflake } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { createPortal } from 'react-dom';

type Named = FreezeCandidate & { name: string };

/** What to do after the hint: which items to move, and whether the unsuitable ones are forced. */
export interface FreezePlan<T> {
  move: T[];
  /** «Trotzdem einfrieren»: `inventory.move` gets `allowUnsuitable`. */
  force: boolean;
  /** Unsuitable items the person left where they are («Lieber nicht»). */
  skipped: T[];
}

interface Pending {
  advice: FreezeAdvice<Named>;
  answer: (force: boolean) => void;
}

/**
 * The calm hint before food that does not freeze well goes into the freezer (R2-1): item page,
 * selection bar and drag onto the Tiefkühler tab all ask here. `ask` resolves at once when every
 * item is suitable; otherwise a sheet names the unsuitable ones with the reason of their category.
 * «Lieber nicht» moves only the suitable ones, «Trotzdem einfrieren» moves all.
 */
export function useFreezeHint(): {
  ask: <T extends Named>(items: readonly T[]) => Promise<FreezePlan<T>>;
  sheet: ReactNode;
} {
  const [pending, setPending] = useState<Pending | null>(null);

  const ask = useCallback(<T extends Named>(items: readonly T[]) => {
    const advice = adviseFreezing(items);
    if (advice.unsuitable.length === 0) {
      return Promise.resolve<FreezePlan<T>>({ move: [...items], force: false, skipped: [] });
    }
    return new Promise<FreezePlan<T>>((resolve) => {
      setPending({
        advice,
        answer: (force) => {
          setPending(null);
          resolve(
            force
              ? { move: [...items], force: true, skipped: [] }
              : {
                  move: advice.suitable,
                  force: false,
                  skipped: advice.unsuitable.map((entry) => entry.item),
                },
          );
        },
      });
    });
  }, []);

  useEffect(() => {
    if (pending === null) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        pending.answer(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [pending]);

  return { ask, sheet: pending === null ? null : <FreezeHintSheet pending={pending} /> };
}

function FreezeHintSheet({ pending }: { pending: Pending }) {
  const t = messages.freezeHint;
  const { suitable, unsuitable } = pending.advice;
  // On the body, so the tab bar does not cover the bottom of the sheet (ADR-0082).
  return createPortal(
    <div className="sheet-backdrop">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="freeze-hint-title"
        aria-describedby="freeze-hint-body"
        className="sheet-panel space-y-4"
      >
        <h2 id="freeze-hint-title" className="font-display text-xl font-semibold">
          {t.title}
        </h2>
        <div id="freeze-hint-body" className="space-y-3">
          <ul className="space-y-2">
            {unsuitable.map(({ item, note }) => (
              <li key={item.id}>
                <span className="font-semibold">{item.name}</span>
                <span className="block text-ink-muted">{note ?? t.general}</span>
              </li>
            ))}
          </ul>
          {suitable.length === 0 ? null : (
            <p className="text-ink-muted">{t.others(suitable.length)}</p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            fullWidth
            autoFocus
            onClick={() => {
              pending.answer(false);
            }}
          >
            {t.keep}
          </Button>
          <Button
            variant="secondary"
            icon={Snowflake}
            fullWidth
            onClick={() => {
              pending.answer(true);
            }}
          >
            {t.force}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
