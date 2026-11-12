import {
  categoryById,
  fallbackCategory,
  itemValue,
  shouldSuggestFreezing,
  startOfMonth,
  sumRappen,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardCheck, Snowflake } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { BigNumber } from '../../ui/BigNumber';
import { Card } from '../../ui/Card';
import { expiryBadge } from '../../ui/expiry-badge';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { InventoryItemRow } from '../inventory/InventoryItemRow';
import { SWIPE_HINT_ID, useSwipeOutcome } from '../inventory/swipe-outcome';
import { SwipeAction } from '../../ui/SwipeAction';
import { RecentAchievements } from '../achievements/RecentAchievements';
import { ClimateCard } from '../climate/ClimateCard';
import { checkDue, readLastCheck } from '../check/check-state';
import { ImpactCard } from './ImpactCard';
import { LocationTiles } from './LocationTiles';
import { locationCounts } from './location-counts';
import { ImpactSince } from './ImpactSince';
import { factFor } from '../knowledge/food-facts';
import { StartIntro } from './StartIntro';
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

      {all.length === 0 ? <StartIntro /> : null}

      {all.length > 0 ? (
        <Card variant="premium">
          <BigNumber value={money.format(total)} label={t.valueLabel} onDark />
          {estimated ? <p className="mt-1 text-sm text-silver">{t.estimated}</p> : null}
        </Card>
      ) : null}

      {all.length > 0 ? <LocationTiles counts={locationCounts(all, urgent)} /> : null}

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

      {all.length === 0 ? null : (
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
                    {shouldSuggestFreezing(item, today) ? (
                      <button
                        type="button"
                        aria-label={messages.rescue.freezeLabel(item.name)}
                        className="mr-4 mb-2 ml-auto flex min-h-11 w-fit items-center gap-2 rounded-xl px-3 font-semibold text-basil-700 transition-colors hover:bg-surface-muted"
                        onClick={() => {
                          swipe.freeze(item);
                        }}
                      >
                        <Snowflake size={20} aria-hidden="true" />
                        {messages.rescue.freeze}
                      </button>
                    ) : null}
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
      )}

      <ImpactCard from={startOfMonth(today)} to={today} />
      <ImpactSince />
      <ClimateCard />
      <RecentAchievements />
      {all.length > 0 ? (
        <Card variant="tip">
          <strong>{messages.knowledge.didYouKnow}</strong> {factFor(today)}
        </Card>
      ) : null}
      {swipe.toast}
    </div>
  );
}
