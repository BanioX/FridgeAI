import { formatSwissDate, isWeekReviewDay, previousWeek, type LocalDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { useMoney } from '../../app/money';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

const t = messages.today;
/** Device-local: the Monday of the last week the person marked as seen (SE-30). */
const SEEN_KEY = 'fridgeai:week-review-seen';

function seenWeek(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function markSeen(monday: LocalDate) {
  try {
    window.localStorage.setItem(SEEN_KEY, monday);
  } catch {
    // Storage blocked (private mode): the card simply hides for this visit.
  }
}

/**
 * «Deine Woche» (ADR-0090): from Monday to Wednesday a look back at the calendar week before,
 * without a server or a notification. Hidden after «Gesehen» and when nothing happened.
 */
export function WeekReview() {
  const { householdId, inventory, today } = useAppData();
  const money = useMoney();
  const week = previousWeek(today);
  const [hidden, setHidden] = useState(() => seenWeek() === week.from);
  const stats = useLiveQuery(
    () => inventory['stats.waste']({ householdId, from: week.from, to: week.to }),
    [householdId, week.from, week.to],
  );
  if (hidden || !isWeekReviewDay(today) || stats === undefined) {
    return null;
  }
  if (stats.usedCount + stats.wastedCount === 0) {
    return null;
  }
  return (
    <Card>
      <section aria-labelledby="week-review-title" className="space-y-3">
        <div>
          <h2 id="week-review-title" className="font-display text-xl font-semibold">
            {t.weekTitle}
          </h2>
          <p className="text-sm text-ink-muted">
            {t.weekPeriod(formatSwissDate(week.from), formatSwissDate(week.to))}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-muted p-3">
            <dt className="text-sm text-ink-muted">{t.used}</dt>
            <dd className="font-display text-lg font-semibold tabular-nums">
              {money.format(stats.usedRappen)}
            </dd>
            <dd className="text-sm text-ink-muted">{t.wastedCount(stats.usedCount)}</dd>
          </div>
          <div className="rounded-xl bg-surface-muted p-3">
            <dt className="text-sm text-ink-muted">{t.wasted}</dt>
            <dd className="font-display text-lg font-semibold text-danger tabular-nums">
              {money.format(stats.wastedRappen)}
            </dd>
            <dd className="text-sm text-ink-muted">{t.wastedCount(stats.wastedCount)}</dd>
          </div>
        </dl>
        {stats.wastedCount === 0 ? (
          <p>{t.weekNoWaste}</p>
        ) : (
          <p>
            {t.weekTip}{' '}
            <Link to="/more/history?outcome=wasted" className="font-semibold text-basil-800">
              {t.weekJournal}
            </Link>
          </p>
        )}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            markSeen(week.from);
            setHidden(true);
          }}
        >
          {t.weekSeen}
        </Button>
      </section>
    </Card>
  );
}
