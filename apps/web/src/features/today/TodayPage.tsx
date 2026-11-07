import {
  categoryById,
  fallbackCategory,
  formatChf,
  itemValue,
  startOfMonth,
  sumRappen,
  type StorageLocation,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { DEV_TOOLS } from '../../app/dev-tools';
import { messages } from '../../app/messages.de-CH';
import { BigNumber } from '../../ui/BigNumber';
import { Card } from '../../ui/Card';
import { LocationTile } from '../../ui/LocationTile';
import { expiryBadge } from '../../ui/expiry-badge';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { InventoryItemRow } from '../inventory/InventoryItemRow';
import { locationOrder } from '../inventory/item-meta';
import { checkDue, readLastCheck } from '../check/check-state';
import { RecipeIdeas } from '../recipes/RecipeIdeas';
import { ImpactCard } from './ImpactCard';

export function TodayPage() {
  const { householdId, inventory, today } = useAppData();
  // Read once per visit; a finished check writes it before coming back here.
  const [lastCheck] = useState(readLastCheck);
  const all = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const expiring = useLiveQuery(
    async () => (await inventory['inventory.listExpiring']({ householdId })).items,
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
  const countOf = (location: StorageLocation) =>
    all.filter((item) => item.location === location).length;
  const showCheck = countOf('fridge') > 0 && checkDue(lastCheck, today);
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
        <Card>
          <BigNumber value={formatChf(total)} label={t.valueLabel} />
          {estimated ? <p className="mt-1 text-sm text-ink-muted">{t.estimated}</p> : null}
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
        {expiring.length === 0 ? (
          <Card variant="tip">{t.expiringEmpty}</Card>
        ) : (
          <GroupedList>
            {expiring.map((item) => (
              <GroupedListItem key={item.id}>
                <Link to={`/inventory/${item.id}`} className={GROUPED_ROW_LINK}>
                  <InventoryItemRow
                    chevron
                    item={item}
                    status={expiryBadge(item.status, item.expiresOn, today, item.location)}
                  />
                </Link>
              </GroupedListItem>
            ))}
          </GroupedList>
        )}
      </section>

      <RecipeIdeas />

      <ImpactCard from={startOfMonth(today)} to={today} />

      <section aria-labelledby="locations-title" className="space-y-3">
        <h2 id="locations-title" className="font-display text-xl font-semibold">
          {t.locationsTitle}
        </h2>
        <ul className="grid grid-cols-2 gap-3">
          {locationOrder.map((location) => (
            <li key={location}>
              <Link
                to={`/inventory?location=${location}`}
                className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <LocationTile
                  location={location}
                  label={messages.locations[location]}
                  countLabel={t.itemCount(countOf(location))}
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
