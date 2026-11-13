import {
  addDays,
  expiryStatus,
  soonThresholdFor,
  type InventoryItemView,
  type LocalDate,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Snowflake } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { DateField } from '../../ui/DateField';
import { expiryBadge } from '../../ui/expiry-badge';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { InventoryItemRow } from '../inventory/InventoryItemRow';
import { useMoveSelected } from '../inventory/use-move-selected';
import { vacationPlan } from './vacation-plan';

const t = messages.vacation;

/**
 * «Ferien-Check» under «Mehr» (ADR-0069): before going away, the person says when they leave and
 * when they are back. The page lists what runs out before then, split into what can be frozen
 * (one tap, through the same freeze hint and `inventory.move` as everywhere) and what has to be
 * used up.
 */
export function VacationPage() {
  const { householdId, inventory, today } = useAppData();
  const [leave, setLeave] = useState<LocalDate | null>(addDays(today, 1));
  const [back, setBack] = useState<LocalDate | null>(addDays(today, 8));
  const mover = useMoveSelected();
  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );

  const badOrder = leave !== null && back !== null && back < leave;
  const plan = items === undefined || back === null || badOrder ? null : vacationPlan(items, back);

  const row = (item: InventoryItemView, freezable: boolean) => {
    const status = expiryBadge(
      expiryStatus(item.expiresOn, today, item.expiryKind, soonThresholdFor(item.location)),
      item.expiresOn,
      today,
      item.location,
    );
    return (
      <GroupedListItem key={item.id}>
        <InventoryItemRow item={item} status={status} />
        {freezable ? (
          <div className="px-4 pb-3">
            <Button
              variant="secondary"
              icon={Snowflake}
              disabled={mover.busy}
              aria-label={t.freezeOne(item.name)}
              onClick={() => {
                void mover.move([item], 'freezer');
              }}
            >
              {t.freeze}
            </Button>
          </div>
        ) : null}
      </GroupedListItem>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{t.title}</h1>
      </div>
      <p className="text-ink-muted">{t.intro}</p>

      <div className="space-y-5">
        <DateField
          label={t.leave}
          value={leave}
          onChange={setLeave}
          today={today}
          location="fridge"
        />
        <DateField label={t.back} value={back} onChange={setBack} today={today} location="fridge" />
      </div>
      {badOrder ? (
        <p role="alert" className="font-semibold text-today">
          {t.badOrder}
        </p>
      ) : null}

      {plan === null ? null : items?.length === 0 ? (
        <p role="status" className="text-ink-muted">
          {t.noStock}
        </p>
      ) : plan.freeze.length === 0 && plan.useUp.length === 0 ? (
        <p role="status" className="font-semibold">
          {t.nothing}
        </p>
      ) : (
        <>
          {plan.freeze.length === 0 ? null : (
            <section aria-labelledby="vacation-freeze" className="space-y-3">
              <h2 id="vacation-freeze" className="text-lg font-semibold">
                {t.freezeTitle(plan.freeze.length)}
              </h2>
              <p className="text-ink-muted">{t.freezeText}</p>
              <Button
                icon={Snowflake}
                fullWidth
                disabled={mover.busy}
                onClick={() => {
                  void mover.move(plan.freeze, 'freezer');
                }}
              >
                {t.freezeAll}
              </Button>
              <GroupedList>{plan.freeze.map((item) => row(item, true))}</GroupedList>
            </section>
          )}
          {plan.useUp.length === 0 ? null : (
            <section aria-labelledby="vacation-use-up" className="space-y-3">
              <h2 id="vacation-use-up" className="text-lg font-semibold">
                {t.useUpTitle(plan.useUp.length)}
              </h2>
              <p className="text-ink-muted">{t.useUpText}</p>
              <GroupedList>{plan.useUp.map((item) => row(item, false))}</GroupedList>
            </section>
          )}
        </>
      )}
      {mover.toast}
    </div>
  );
}
