import {
  aiImportPrompt,
  displayQuantity,
  fallbackCategory,
  formatSwissDate,
  matchCategoryByName,
  parseAiImport,
  StorageLocationSchema,
  type AiImportItem,
  type AiImportResult,
  type Id,
  type StorageLocation,
} from '@fridgeai/core';
import { Copy, ScanBarcode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { formatAmount } from '../inventory/add-item';
import { locationOrder } from '../inventory/item-meta';

const t = messages.aiImport;

function quantityText(item: AiImportItem): string {
  const shown = displayQuantity(item.quantity, item.unit);
  return `${formatAmount(shown.amount)} ${messages.inputUnits[shown.unit]}`;
}

interface Review {
  result: AiImportResult;
  /** One id per item, fixed when checking: a retry after an error never adds an item twice. */
  commandIds: Id[];
}

/**
 * «Mit eigener KI erfassen» (ADR-0012, stage 1): copy the prompt, let the person's own AI read a
 * photo, paste the answer, review and take over. No server, no cost, nothing stored before
 * «übernehmen».
 */
export function AiImportPage() {
  const { householdId, ids, inventory, today } = useAppData();
  const navigate = useNavigate();
  const prompt = aiImportPrompt(today);
  const [copyStatus, setCopyStatus] = useState('');
  const [answer, setAnswer] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(new Set());
  const [locations, setLocations] = useState<ReadonlyMap<number, StorageLocation>>(new Map());
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const reviewHeading = useRef<HTMLHeadingElement>(null);

  // After «Prüfen», move focus (and the view) to the result, also for screen readers.
  useEffect(() => {
    reviewHeading.current?.focus();
  }, [review]);

  const locationOf = (item: AiImportItem, index: number): StorageLocation =>
    locations.get(index) ??
    item.location ??
    (matchCategoryByName(item.name) ?? fallbackCategory()).defaultLocation;
  const chosenCount = review === null ? 0 : review.result.items.length - excluded.size;

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyStatus(t.copied);
    } catch {
      setCopyStatus(t.copyFailed);
    }
  }

  function check() {
    const result = parseAiImport(answer, today);
    setReview({ result, commandIds: result.items.map(() => ids.next()) });
    setExcluded(new Set());
    setLocations(new Map());
    setStatus('');
  }

  async function save() {
    if (review === null || saving) {
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      for (const [index, item] of review.result.items.entries()) {
        const commandId = review.commandIds[index];
        if (excluded.has(index) || commandId === undefined) {
          continue;
        }
        await inventory['inventory.addItem']({
          commandId,
          householdId,
          name: item.name,
          location: locationOf(item, index),
          quantity: item.quantity,
          unit: item.unit,
          ...(item.container === undefined ? {} : { container: item.container }),
          ...(item.expiresOn === undefined
            ? {}
            : { expiresOn: item.expiresOn, expirySource: 'label_ocr' }),
        });
      }
      void navigate('/inventory');
    } catch {
      setStatus(t.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="large-title">{messages.pages.scan}</h1>

      <Link
        to="/inventory/new?scan=1"
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-basil-700 px-5 font-semibold text-white transition-colors hover:bg-basil-800 active:bg-basil-900"
      >
        <ScanBarcode size={20} aria-hidden="true" />
        {messages.scanner.open}
      </Link>

      <h2 className="font-display text-xl font-semibold">{t.title}</h2>
      <p className="text-ink-muted">{t.intro}</p>

      <Card>
        <h2 className="font-semibold">{t.step1}</h2>
        <Button
          icon={Copy}
          fullWidth
          className="mt-3"
          onClick={() => {
            void copy();
          }}
        >
          {t.copy}
        </Button>
        <p role="status" className="mt-2 text-sm font-semibold text-basil-800">
          {copyStatus}
        </p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-basil-700">{t.showPrompt}</summary>
          <pre className="mt-2 rounded-xl bg-surface-muted p-3 font-sans whitespace-pre-wrap select-all">
            {prompt}
          </pre>
        </details>
        <h2 className="mt-5 font-semibold">{t.step2}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.privacy}</p>
      </Card>

      <div className="space-y-2">
        <h2 className="font-semibold">{t.step3}</h2>
        <label htmlFor="ai-answer" className="block text-sm text-ink-muted">
          {t.answer}
        </label>
        <textarea
          id="ai-answer"
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
          }}
          rows={6}
          aria-describedby="ai-answer-hint"
          className="w-full rounded-xl border border-line bg-surface p-3 font-mono text-sm outline-none focus:border-basil-600"
        />
        <p id="ai-answer-hint" className="text-sm text-ink-muted">
          {t.answerHint}
        </p>
        <Button variant="secondary" fullWidth disabled={answer.trim() === ''} onClick={check}>
          {t.check}
        </Button>
      </div>

      {review === null ? null : review.result.unreadable ? (
        <Card variant="tip">{t.unreadable}</Card>
      ) : (
        <section aria-labelledby="review-title" className="space-y-3">
          <h2
            id="review-title"
            ref={reviewHeading}
            tabIndex={-1}
            className="scroll-mt-20 font-display text-xl font-semibold outline-none"
          >
            {t.reviewTitle(review.result.items.length)}
          </h2>
          <ul className="space-y-2">
            {review.result.items.map((item, index) => {
              const included = !excluded.has(index);
              const emoji = (matchCategoryByName(item.name) ?? fallbackCategory()).emoji;
              return (
                <li
                  key={review.commandIds[index]}
                  className={`flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card ${included ? '' : 'opacity-60'}`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => {
                        const next = new Set(excluded);
                        if (included) {
                          next.add(index);
                        } else {
                          next.delete(index);
                        }
                        setExcluded(next);
                      }}
                      className="size-6 shrink-0 accent-basil-700"
                    />
                    <span aria-hidden="true" className="text-2xl">
                      {emoji}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{item.name}</span>
                      <span className="block text-sm text-ink-muted">
                        {quantityText(item)} ·{' '}
                        {item.expiresOn === undefined
                          ? t.estimated
                          : t.until(formatSwissDate(item.expiresOn))}
                      </span>
                    </span>
                  </label>
                  <select
                    aria-label={t.location(item.name)}
                    value={locationOf(item, index)}
                    onChange={(event) => {
                      const parsed = StorageLocationSchema.safeParse(event.target.value);
                      if (parsed.success) {
                        setLocations(new Map(locations).set(index, parsed.data));
                      }
                    }}
                    className="min-h-11 shrink-0 rounded-xl border border-line bg-surface px-2 text-sm"
                  >
                    {locationOrder.map((location) => (
                      <option key={location} value={location}>
                        {messages.locations[location]}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
          {review.result.skipped.length === 0 ? null : (
            <div className="text-sm text-ink-muted">
              <p>{t.skipped(review.result.skipped.length)}</p>
              <ul className="mt-1 list-disc pl-5">
                {review.result.skipped.map((entry, index) => (
                  <li key={`${String(index)}-${entry.entry}`} className="break-all">
                    {entry.entry}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p role="status" className="font-semibold text-today">
            {status}
          </p>
          <Button
            fullWidth
            disabled={saving || chosenCount === 0}
            onClick={() => {
              void save();
            }}
          >
            {t.save(chosenCount)}
          </Button>
        </section>
      )}

      <Link
        to="/inventory/new"
        className="inline-flex min-h-12 items-center font-semibold text-basil-700"
      >
        {t.manual}
      </Link>
    </div>
  );
}
