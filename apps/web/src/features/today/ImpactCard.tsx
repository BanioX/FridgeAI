import { formatChf, type LocalDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { formatQuantity } from '../../ui/quantity-text';

const t = messages.today;

/**
 * «Deine Wirkung diesen Monat» (step 6, US-06): saved (eaten or given away) against wasted, in
 * CHF and weight, from `stats.waste`. Hidden until something was closed in the period.
 */
export function ImpactCard({ from, to }: { from: LocalDate; to: LocalDate }) {
  const { householdId, inventory } = useAppData();
  const stats = useLiveQuery(
    () => inventory['stats.waste']({ householdId, from, to }),
    [householdId, from, to],
  );
  if (stats === undefined) {
    return null;
  }
  const total = stats.savedRappen + stats.wastedRappen;
  if (total === 0 && stats.savedGrams + stats.wastedGrams === 0) {
    return null;
  }
  const percent =
    total === 0
      ? Math.round((100 * stats.savedGrams) / (stats.savedGrams + stats.wastedGrams))
      : Math.round((100 * stats.savedRappen) / total);

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">{t.impactTitle}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-basil-50 p-3">
          <dt className="text-sm font-semibold text-basil-800">{t.saved}</dt>
          <dd className="font-display text-2xl font-semibold text-basil-800 tabular-nums">
            {formatChf(stats.savedRappen)}
          </dd>
          <dd className="text-sm text-ink-muted tabular-nums">
            {formatQuantity(stats.savedGrams, 'g')}
          </dd>
        </div>
        <div className="rounded-xl bg-surface-muted p-3">
          <dt className="text-sm font-semibold text-today">{t.wasted}</dt>
          <dd className="font-display text-2xl font-semibold text-today tabular-nums">
            {formatChf(stats.wastedRappen)}
          </dd>
          <dd className="text-sm text-ink-muted tabular-nums">
            {formatQuantity(stats.wastedGrams, 'g')}
          </dd>
        </div>
      </dl>
      <div
        role="img"
        aria-label={t.savedShare(percent)}
        className="mt-3 h-2 overflow-hidden rounded-full bg-today-bg"
      >
        <div
          className="h-full rounded-full bg-basil-600"
          style={{ width: `${String(percent)}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {t.savedShare(percent)}
        {stats.estimated ? ` · ${t.estimated}` : null}
      </p>
      <Link
        to="/more/history"
        className="mt-2 -mb-1 inline-flex min-h-11 items-center gap-0.5 font-semibold text-basil-700"
      >
        {messages.history.link}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  );
}
