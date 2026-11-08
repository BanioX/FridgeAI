import { categoryById, fallbackCategory, itemValue, startOfMonth, sumRappen } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { DEV_TOOLS } from '../../app/dev-tools';
import { messages } from '../../app/messages.de-CH';
import { BigNumber } from '../../ui/BigNumber';
import { Card } from '../../ui/Card';
import { expiryBadge } from '../../ui/expiry-badge';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { InventoryItemRow } from '../inventory/InventoryItemRow';
import { SWIPE_HINT_ID, useSwipeOutcome } from '../inventory/swipe-outcome';
import { SwipeAction } from '../../ui/SwipeAction';
import { checkDue, readLastCheck } from '../check/check-state';
import { ImpactCard } from './ImpactCard';
import { URGENT_LIMIT, urgentItems } from './urgent-items';

const MORE_LINK =
  'inline-flex min-h-11 items-center font-semibold text-basil-800 underline-offset-4 hover:underline';

export function TodayPage() {
  const { householdId, inventory, today } = useAppData();
  const money = useMoney();
  const swipe = useSwipeOutcome();
  // Read once per visit; a finished check writes it before coming back here.
  const [lastCheck] = useState(readLastCheck);
  const all = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const expiring = useLiveQuery(
    async () => (await inventory['inventory.listExpiring']({ householdId, withinDays: 30 })).items,
    [householdId],
  );

  if (all === undefined || expiring === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }

  const fridgeValues = all
    .filter((item) => item.location === 'fridge')
    .map(({ quantity, unit, priceRappen, categoryId }) =>
      itemValue(
        { quantity, unit, ...(priceRappen === undefined ? {} : { priceRappen }) },
        categoryById(categoryId) ?? fallbackCategory(),
      ),
    );
  const total = sumRappen(fridgeValues.map((value) => value.valueRappen));
  const estimated = fridgeValues.some((value) => value.estimated);
  const showCheck = fridgeValues.length > 0 && checkDue(lastCheck, today);
  const urgent = urgentItems(expiring);
  const t = messages.today;

  return (
    <div className="space-y-6">
      <h1 className="large-title">{messages.pages.start}</h1>

      {all.length === 0 ? (
        <Card>
          <h2 className="font-display text-xl font-semibold">{t.welcomeTitle}</h2>
          <p className="mt-2 text-ink-muted">{t.welcomeText}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              to="/inventory/new"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-basil-700 px-5 font-semibold text-white transition-colors hover:bg-basil-800 active:bg-basil-900"
            >
              {t.firstItem}
            </Link>
            {DEV_TOOLS ? (
              <Link
                to="/dev/seed"
                className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 font-semibold text-basil-800 underline-offset-4 hover:underline"
              >
                {t.loadDemo}
              </Link>
            ) : null}
          </div>
        </Card>
      ) : null}

      {all.length > 0 ? (
        <Card variant="premium">
          <BigNumber value={money.format(total)} label={t.valueLabel} onDark />
          {estimated ? <p className="mt-1 text-sm text-silver">{t.estimated}</p> : null}
        </Card>
      ) : null}

      {showCheck ? (
        <Card variant="tip" className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <ClipboardCheck size={20} aria-hidden="true" />
            {messages.pages.check}
          </h2>
          <p>{messages.check.cardText}</p>
          <Link
            to="/check"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-basil-700 px-4 font-semibold text-white transition-colors hover:bg-basil-800 active:bg-basil-900"
          >
            {messages.check.cardStart}
          </Link>
        </Card>
      ) : null}

      <section aria-labelledby="expiring-title" className="space-y-3">
        <h2 id="expiring-title" className="font-display text-xl font-semibold">
          {t.expiringTitle}
        </h2>
        {urgent.length === 0 ? (
          <Card variant="tip">{t.expiringEmpty}</Card>
        ) : (
          <>
            {swipe.tip}
            <GroupedList>
              {urgent.slice(0, URGENT_LIMIT).map((item) => (
                <GroupedListItem key={item.id}>
                  <SwipeAction {...swipe.sides(item)}>
                    {({ sliced }) => (
                      <Link
                        to={`/inventory/${item.id}`}
                        aria-describedby={SWIPE_HINT_ID}
                        className={GROUPED_ROW_LINK}
                      >
                        <InventoryItemRow
                          chevron
                          sliced={sliced}
                          item={item}
                          status={expiryBadge(item.status, item.expiresOn, today, item.location)}
                        />
                      </Link>
                    )}
                  </SwipeAction>
                </GroupedListItem>
              ))}
            </GroupedList>
          </>
        )}
        {urgent.length > URGENT_LIMIT ? (
          <Link to="/inventory" className={MORE_LINK}>
            {t.showAll(urgent.length)}
          </Link>
        ) : null}
      </section>

      <ImpactCard from={startOfMonth(today)} to={today} />
      {swipe.toast}
    </div>
  );
}
