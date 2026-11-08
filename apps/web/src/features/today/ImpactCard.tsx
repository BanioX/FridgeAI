import type { LocalDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { OutcomeRings } from '../../ui/OutcomeRings';
import { ringShare } from '../../ui/ring-share';
import { RettichGrowth } from './RettichGrowth';

const t = messages.today;

/** «November» for any day in November, for «Bilanz November». */
const monthName = (day: LocalDate) =>
  messages.reports.monthNames[Number(day.slice(5, 7)) - 1] ?? '';

/**
 * «Bilanz November» (step 6, US-06, ADR-0047): the growing Rettich (ADR-0043), then «Verwertet»
 * and «Entsorgt» as two rings (ADR-0046), and below what was rescued: confirmed rescues of food
 * at risk (ADR-0033, ADR-0039). Hidden until something was closed in the period.
 */
export function ImpactCard({ from, to }: { from: LocalDate; to: LocalDate }) {
  const { householdId, inventory } = useAppData();
  const money = useMoney();
  const stats = useLiveQuery(
    () => inventory['stats.waste']({ householdId, from, to }),
    [householdId, from, to],
  );
  if (stats === undefined || stats.usedCount + stats.wastedCount === 0) {
    return null;
  }
  const used = { rappen: stats.usedRappen, count: stats.usedCount };
  const wasted = { rappen: stats.wastedRappen, count: stats.wastedCount };
  const atRisk = stats.savedRappen + stats.wastedRappen;
  const percent =
    stats.savedCount + stats.wastedCount === 0
      ? null
      : atRisk === 0
        ? Math.round((100 * stats.savedCount) / (stats.savedCount + stats.wastedCount))
        : Math.round((100 * stats.savedRappen) / atRisk);

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">{t.impactTitle(monthName(from))}</h2>
      <div className="mt-3">
        <RettichGrowth rescues={stats.savedCount} />
      </div>
      <div className="mt-4">
        <OutcomeRings
          used={{
            label: t.used,
            share: ringShare(used, wasted),
            value: money.format(stats.usedRappen),
            detail: t.wastedCount(stats.usedCount),
          }}
          wasted={{
            label: t.wasted,
            share: ringShare(wasted, used),
            value: money.format(stats.wastedRappen),
            detail: t.wastedCount(stats.wastedCount),
          }}
        />
      </div>
      <div className="mt-4 rounded-xl bg-basil-50 p-3">
        <p className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-basil-800">{t.saved}</span>
          <span className="font-display text-xl font-semibold text-basil-800 tabular-nums">
            {money.format(stats.savedRappen)}
          </span>
        </p>
        <p className="text-sm text-ink-muted">
          {t.savedCount(stats.savedCount)}
          {percent === null ? null : ` · ${t.savedShare(percent)} ${t.ofAtRisk}`}
          {stats.estimated ? ` · ${t.estimated}` : null}
        </p>
      </div>
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
