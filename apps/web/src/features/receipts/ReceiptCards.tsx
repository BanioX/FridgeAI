import { formatSwissDate, shelfLifeAt, type LocalDate } from '@fridgeai/core';
import { ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { messages } from '../../app/messages.de-CH';
import { useMoney } from '../../app/money';
import { Button } from '../../ui/Button';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { DateField } from '../../ui/DateField';
import { ShopBadge } from '../../ui/ShopBadge';
import { PriceField } from './PriceField';
import {
  buildCards,
  categoryFor,
  chosenExpiry,
  expiryOf,
  locationOf,
  PLACES,
  summarize,
  summaryRows,
  type SummaryRow,
  withDecision,
  withExpiry,
  withLocation,
  type Card,
  type CardSection,
} from './receipt-cards';
import { MatchRow, type ReceiptMatching } from './ReceiptMatch';
import { amountText, paid, withPrice, type Review } from './ReceiptReview';

const t = messages.receiptUpload.cards;
const rt = messages.receiptUpload;

interface ReceiptCardsProps {
  sections: readonly CardSection[];
  /** The matching of a receipt, by section key; asked again on every render of the sheet. */
  matchingOf: (sectionKey: string) => ReceiptMatching | undefined;
  today: LocalDate;
  onReview: (sectionKey: string, review: Review) => void;
  onClose: () => void;
  /** The same take action as the list: one import path, one commandId per receipt. */
  onTake: () => void;
  takeLabel: string;
  takeDisabled: boolean;
}

/**
 * «Einzeln durchgehen» (ticket #42): the food lines of the receipts on the page, one card at a
 * time: product, date, place and price. It edits the same `Review` state as the list, so the
 * list shows every choice; at the end the list's take action stores everything.
 */
export function ReceiptCards({
  sections,
  matchingOf,
  today,
  onReview,
  onClose,
  onTake,
  takeLabel,
  takeDisabled,
}: ReceiptCardsProps) {
  // The walk is fixed when the sheet opens: ticking a line must not shorten it.
  const [cards] = useState<readonly Card[]>(() => buildCards(sections));
  const [position, setPosition] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const finished = position >= cards.length;
  const card = cards[position];

  // The card (or the summary) is announced and the keyboard starts there.
  useEffect(() => {
    heading.current?.focus();
  }, [position]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const shown = Math.min(position + 1, cards.length);
  const counts = summarize(sections, cards);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-cards-title"
      className="fixed inset-0 z-40 flex flex-col bg-surface text-ink"
    >
      <header className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 pt-3">
        <h2 id="receipt-cards-title" className="min-w-0 flex-1 font-display text-lg font-semibold">
          {t.title}
        </h2>
        <button
          type="button"
          aria-label={t.close}
          onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>
      <div className="mx-auto w-full max-w-xl px-4">
        <p aria-live="polite" className="text-sm font-semibold text-ink-muted">
          {t.progress(shown, cards.length)}
        </p>
        <div aria-hidden="true" className="mt-1 h-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-basil-700 transition-[width]"
            style={{
              width: `${String(cards.length === 0 ? 100 : (position / cards.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-xl space-y-5 px-4 py-5">
          {finished || card === undefined ? (
            <section className="space-y-2">
              <h3 ref={heading} tabIndex={-1} className="text-2xl font-semibold outline-none">
                {t.summaryTitle}
              </h3>
              <p className="text-lg">{t.summary(counts.taken, counts.left)}</p>
              <SummaryList
                rows={summaryRows(sections, cards, today)}
                onOpen={(row) => {
                  setPosition(row.position);
                }}
              />
            </section>
          ) : (
            <CardBody
              key={`${card.sectionKey}-${String(card.index)}`}
              card={card}
              section={sections.find((section) => section.key === card.sectionKey)}
              matching={matchingOf(card.sectionKey)}
              today={today}
              heading={heading}
              onReview={onReview}
            />
          )}
        </div>
      </div>

      <footer className="border-t border-line bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-xl space-y-2">
          {finished || card === undefined ? (
            <Button fullWidth disabled={takeDisabled} onClick={onTake}>
              {takeLabel}
            </Button>
          ) : (
            <Button
              fullWidth
              onClick={() => {
                const section = sections.find((entry) => entry.key === card.sectionKey);
                if (section !== undefined) {
                  onReview(card.sectionKey, withDecision(section.review, card.index, true));
                }
                setPosition(position + 1);
              }}
            >
              {t.take}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              fullWidth
              disabled={position === 0}
              onClick={() => {
                setPosition(position - 1);
              }}
            >
              {t.back}
            </Button>
            {finished || card === undefined ? (
              <Button variant="secondary" fullWidth onClick={onClose}>
                {t.close}
              </Button>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  const section = sections.find((entry) => entry.key === card.sectionKey);
                  if (section !== undefined) {
                    onReview(card.sectionKey, withDecision(section.review, card.index, false));
                  }
                  setPosition(position + 1);
                }}
              >
                {t.skip}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>,
    document.body,
  );
}

function CardBody({
  card,
  section,
  matching,
  today,
  heading,
  onReview,
}: {
  card: Card;
  section: CardSection | undefined;
  matching: ReceiptMatching | undefined;
  today: LocalDate;
  heading: RefObject<HTMLHeadingElement | null>;
  onReview: (sectionKey: string, review: Review) => void;
}) {
  // While a typed date is not complete, the field stays empty instead of jumping to the estimate.
  const [typing, setTyping] = useState(false);
  const line = section?.review.receipt.lines[card.index];
  if (section === undefined || line === undefined) {
    return null;
  }
  const { review } = section;
  const { index } = card;
  const location = locationOf(review, index);
  const places = PLACES.includes(location) ? PLACES : [...PLACES, location];
  const picked = chosenExpiry(review, index);
  const place = [rt.retailers[review.receipt.retailer], review.receipt.storeName]
    .filter(Boolean)
    .join(' · ');
  const update = (next: Review) => {
    onReview(section.key, next);
  };

  return (
    <>
      <section className="space-y-2">
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          {review.receipt.retailer === 'other' ? null : (
            <ShopBadge retailer={review.receipt.retailer} size={22} />
          )}
          <span className="min-w-0 break-words">{place}</span>
        </p>
        <h3 ref={heading} tabIndex={-1} className="text-2xl font-semibold break-words outline-none">
          {line.name}
        </h3>
        <p className="text-ink-muted">{`${t.amount}: ${amountText(line)}`}</p>
        {review.chosen.has(index) ? null : (
          <p className="text-sm font-semibold text-today">{t.leftOutNote}</p>
        )}
        {matching === undefined ? null : (
          <MatchRow matching={matching} index={index} name={line.name} flush />
        )}
      </section>

      <ChoiceChips
        legend={t.place}
        options={places.map((value) => ({ value, label: messages.locations[value] }))}
        value={location}
        onChange={(value) => {
          setTyping(false);
          update(withLocation(review, index, value));
        }}
      />

      <DateField
        label={t.expiry}
        value={typing && picked === undefined ? null : expiryOf(review, index, today)}
        onChange={(value) => {
          setTyping(value === null);
          update(withExpiry(review, index, value));
        }}
        today={today}
        location={location}
        typicalShelfLifeDays={shelfLifeAt(categoryFor(review, index), location)}
        estimated={picked === undefined}
      />

      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{t.price}</span>
        <PriceField
          name={line.name}
          value={paid(line)}
          onChange={(price) => {
            update({ ...review, receipt: withPrice(review.receipt, index, price) });
          }}
        />
      </div>
    </>
  );
}

/** The overview after the last card: one tap goes back to a line's card to change it. */
function SummaryList({
  rows,
  onOpen,
}: {
  rows: readonly SummaryRow[];
  onOpen: (row: SummaryRow) => void;
}) {
  const money = useMoney();
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="space-y-2 pt-2">
      <p className="text-sm text-ink-muted">{t.summaryHint}</p>
      <ul aria-label={t.summaryList} className="divide-y divide-line rounded-xl border border-line">
        {rows.map((row) => {
          const detail = row.taken
            ? `${messages.locations[row.location]} · ${t.until(formatSwissDate(row.expiresOn))}`
            : t.leftOut;
          return (
            <li key={row.position}>
              <button
                type="button"
                onClick={() => {
                  onOpen(row);
                }}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate font-semibold ${row.taken ? '' : 'text-ink-muted line-through'}`}
                  >
                    {row.name}
                  </span>
                  <span className="block truncate text-sm text-ink-muted">{detail}</span>
                </span>
                {row.taken ? (
                  <span className="shrink-0 text-sm tabular-nums">
                    {money.format(row.paidRappen, { currency: false })}
                  </span>
                ) : null}
                <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
