import type { LocalDate, MemberView, Owner, StorageLocation } from '@fridgeai/core';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { DateField } from '../../ui/DateField';
import { OwnerChoice } from '../people/OwnerChoice';
import type { BulkChanges } from './bulk-edit';

/**
 * «N Artikel ändern» (O7): one sheet to set the date, mark as opened or choose the owner for all
 * chosen items. «Übernehmen» applies the date and the owner (only what was chosen); «Alle als
 * angebrochen markieren» applies at once. The owner choice only shows with two or more people.
 */
export function BulkEditSheet({
  count,
  location,
  today,
  members,
  busy,
  onApply,
  onClose,
}: {
  count: number;
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

  const canApply = expiresOn !== null || owner !== null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-onyx/40">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-edit-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="max-h-[92dvh] w-full max-w-xl space-y-5 overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-float outline-none"
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

        <Button
          fullWidth
          disabled={busy || !canApply}
          onClick={() => {
            onApply({
              ...(expiresOn === null ? {} : { expiresOn }),
              ...(owner === null ? {} : { owner }),
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
    </div>
  );
}
