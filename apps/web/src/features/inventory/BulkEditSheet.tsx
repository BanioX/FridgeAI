import type {
  InventoryItemView,
  LocalDate,
  MemberView,
  Owner,
  StorageLocation,
} from '@fridgeai/core';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { DateField } from '../../ui/DateField';
import { OwnerChoice } from '../people/OwnerChoice';
import { useSpots } from '../spots/use-spots';
import { sharedLocation, type BulkChanges } from './bulk-edit';
import { createPortal } from 'react-dom';

/** The chip value for «Kein fester Platz»; spot ids never look like this. */
const NO_SPOT = 'none';

/**
 * «N Artikel ändern» (O7): one sheet to set the date, the place, mark as opened or choose the owner for all
 * chosen items. «Übernehmen» applies the date and the owner (only what was chosen); «Alle als
 * angebrochen markieren» applies at once. The owner choice only shows with two or more people.
 */
export function BulkEditSheet({
  count,
  items,
  location,
  today,
  members,
  busy,
  onApply,
  onClose,
}: {
  count: number;
  items: readonly InventoryItemView[];
  location: StorageLocation;
  today: LocalDate;
  members: readonly MemberView[];
  busy: boolean;
  onApply: (changes: BulkChanges) => void;
  onClose: () => void;
}) {
  const t = messages.inventory.bulk;
  const [expiresOn, setExpiresOn] = useState<LocalDate | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [spot, setSpot] = useState<string | null>(null);
  const spots = useSpots();
  // A spot belongs to one location, so the field only makes sense when all items lie in one.
  const spotLocation = sharedLocation(items);
  const spotsHere =
    spotLocation === null || spots === undefined
      ? null
      : spots.filter((entry) => entry.location === spotLocation);
  const dialog = useRef<HTMLDivElement>(null);

  // Focus goes into the sheet and back to the button that opened it.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.focus();
    return () => {
      opener?.focus();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || dialog.current === null) {
      return;
    }
    // Keep Tab inside the sheet.
    const focusable = [
      ...dialog.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href]',
      ),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (first === undefined || last === undefined) {
      return;
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === dialog.current)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const canApply = expiresOn !== null || owner !== null || spot !== null;

  // On the body, so the tab bar does not cover the bottom of the sheet (ADR-0082).
  return createPortal(
    <div className="sheet-backdrop">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="sheet-panel max-h-[92dvh] space-y-5 overflow-y-auto outline-none"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="bulk-edit-title" className="font-display text-xl font-semibold">
            {t.title(count)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-basil-700 hover:bg-basil-50"
          >
            {t.close}
          </button>
        </div>

        <DateField
          label={t.expiresLabel}
          value={expiresOn}
          onChange={setExpiresOn}
          today={today}
          location={location}
        />

        {members.length >= 2 ? (
          <OwnerChoice members={members} value={owner} onChange={setOwner} />
        ) : null}

        {spotsHere === null ? null : spotsHere.length === 0 ? (
          <p className="text-sm text-ink-muted">{t.spotsHint}</p>
        ) : (
          <ChoiceChips
            legend={t.spotLegend}
            value={spot}
            options={[
              ...spotsHere.map((entry) => ({ value: entry.id, label: entry.name })),
              { value: NO_SPOT, label: t.noSpot },
            ]}
            onChange={setSpot}
          />
        )}

        <Button
          fullWidth
          disabled={busy || !canApply}
          onClick={() => {
            onApply({
              ...(expiresOn === null ? {} : { expiresOn }),
              ...(owner === null ? {} : { owner }),
              ...(spot === null ? {} : { spot: spot === NO_SPOT ? null : spot }),
            });
          }}
        >
          {t.apply}
        </Button>

        <section aria-labelledby="bulk-edit-opened" className="space-y-2 border-t border-line pt-4">
          <h3 id="bulk-edit-opened" className="font-semibold">
            {t.openedTitle}
          </h3>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={() => {
              onApply({ open: true });
            }}
          >
            {t.openAll}
          </Button>
        </section>
      </div>
    </div>,
    document.body,
  );
}
