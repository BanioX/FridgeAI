import {
  type InventoryItemView,
  type LocalDate,
  toLocalDate,
  daysBetween,
  categoryById,
  fallbackCategory,
  itemValue,
  shouldSuggestFreezing,
  startOfMonth,
  sumRappen,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardCheck, HardDriveDownload, Snowflake } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { expiryBadge } from '../../ui/expiry-badge';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { MenuList, type MenuEntry } from '../../ui/MenuList';
import { InventoryItemRow } from '../inventory/InventoryItemRow';
import { useAttention } from '../inventory/use-attention';
import { SWIPE_HINT_ID, useSwipeOutcome } from '../inventory/swipe-outcome';
import { SwipeAction } from '../../ui/SwipeAction';
import { RecentAchievements } from '../achievements/RecentAchievements';
import { ClimateCard } from '../climate/ClimateCard';
import { checkDue, readLastCheck } from '../check/check-state';
import { backupDue, readLastBackup } from '../household/backup-state';
import { ImpactCard } from './ImpactCard';
import { WeekReview } from './WeekReview';
import { LocationTiles } from './LocationTiles';
import { locationCounts } from './location-counts';
import { ImpactSince } from './ImpactSince';
import { StartIntro } from './StartIntro';
import { URGENT_LIMIT, urgentItems } from './urgent-items';
import { useDragToLocation } from '../inventory/use-drag-to-location';
import { RitualTargets } from './RitualTargets';

const MORE_LINK =
  'inline-flex min-h-11 items-center font-semibold text-basil-800 underline-offset-4 hover:underline';

export function TodayPage() {
  const { householdId, inventory, today } = useAppData();
  const money = useMoney();
  // The ritual (ADR-0084) only here: in the Vorrat people sort quickly.
  const swipe = useSwipeOutcome({ ritual: true });
  const attentionOf = useAttention();
  // Read once per visit; a finished check writes it before coming back here.
  const [lastCheck] = useState(readLastCheck);
  const [lastBackup] = useState(readLastBackup);
  const all = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const expiring = useLiveQuery(
    async () => (await inventory['inventory.listExpiring']({ householdId, withinDays: 30 })).items,
    [householdId],
  );

  // Hold a row of «Heute retten» and drag it into the basket or the bin (ADR-0084).
  const held = useRef<InventoryItemView | null>(null);
  const drag = useDragToLocation({
    enabled: true,
    selecting: false,
    from: 'fridge',
    begin: (id) => {
      held.current = expiring?.find((item) => item.id === id) ?? null;
      return held.current?.name ?? '';
    },
    drop: (target) => {
      const item = held.current;
      if (item !== null && target.kind === 'action') {
        if (target.action === 'eaten' || target.action === 'wasted') {
          swipe.settle(item, target.action);
        }
      }
    },
  });

  if (all === undefined || expiring === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }

  const fridgeValues = all
    .filter((item) => item.location === 'fridge')
    .map(({ quantity, unit, priceRappen, priceEstimated, categoryId }) =>
      itemValue(
        {
          quantity,
          unit,
          ...(priceRappen === undefined ? {} : { priceRappen }),
          ...(priceEstimated === undefined ? {} : { priceEstimated }),
        },
        categoryById(categoryId) ?? fallbackCategory(),
      ),
    );
  const total = sumRappen(fridgeValues.map((value) => value.valueRappen));
  const estimated = fridgeValues.some((value) => value.estimated);
  const showCheck = fridgeValues.length > 0 && checkDue(lastCheck, today);
  const urgent = urgentItems(expiring);
  const oldestAddedOn = all.reduce<LocalDate | null>((oldest, item) => {
    const added = toLocalDate(item.purchasedAt);
    return oldest === null || added < oldest ? added : oldest;
  }, null);
  const showBackup = backupDue(lastBackup, today, all.length, oldestAddedOn);
  const t = messages.today;
  const todo: MenuEntry[] = [
    ...(showCheck
      ? [
          {
            to: '/check',
            icon: ClipboardCheck,
            title: messages.pages.check,
            detail: messages.check.rowDetail,
          },
        ]
      : []),
    ...(showBackup
      ? [
          {
            to: '/more/data',
            icon: HardDriveDownload,
            title: t.backup.title,
            detail:
              lastBackup === null ? t.backup.never : t.backup.since(daysBetween(lastBackup, today)),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <h1 className="large-title">{messages.pages.start}</h1>

      {all.length === 0 ? <StartIntro /> : null}

      {all.length > 0 ? (
        <Card
          variant="premium"
          padding="compact"
          className="flex items-center justify-between gap-3"
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-silver">{t.valueShort}</span>
            {estimated ? <span className="block text-xs text-silver">{t.estimated}</span> : null}
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-white tabular-nums">
            {money.format(total)}
          </span>
        </Card>
      ) : null}

      {all.length === 0 ? null : (
        <section aria-labelledby="expiring-title" className="space-y-3">
          <h2 id="expiring-title" className="font-display text-xl font-semibold">
            {t.expiringTitle}
          </h2>
          {urgent.length === 0 ? (
            <p className="text-ink-muted">{t.expiringEmpty}</p>
          ) : (
            <>
              {swipe.tip}
              <GroupedList>
                {urgent.slice(0, URGENT_LIMIT).map((item) => (
                  <GroupedListItem key={item.id}>
                    <div
                      {...drag.rowProps(item.id)}
                      // iOS: a long press must not start Safari's own drag of the link.
                      className="[-webkit-touch-callout:none] select-none [&_a]:[-webkit-user-drag:none]"
                    >
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
                              attention={attentionOf(item).reasons.length > 0}
                              status={expiryBadge(
                                item.status,
                                item.expiresOn,
                                today,
                                item.location,
                              )}
                            />
                          </Link>
                        )}
                      </SwipeAction>
                    </div>
                    {shouldSuggestFreezing(item, today) ? (
                      <button
                        type="button"
                        aria-label={messages.rescue.freezeLabel(item.name)}
                        className="-mt-2 mr-4 mb-1 ml-auto flex min-h-11 w-fit items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-basil-700 transition-colors hover:bg-surface-muted"
                        onClick={() => {
                          swipe.freeze(item);
                        }}
                      >
                        <Snowflake size={16} aria-hidden="true" />
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

      {todo.length > 0 ? <MenuList entries={todo} /> : null}

      {all.length > 0 ? <LocationTiles counts={locationCounts(all, urgent)} /> : null}

      <WeekReview />
      <ImpactCard from={startOfMonth(today)} to={today} />
      <ImpactSince />
      <ClimateCard />
      <RecentAchievements />
      {drag.dragging ? <RitualTargets over={drag.over} /> : null}
      {drag.parcel}
      {swipe.toast}
    </div>
  );
}
