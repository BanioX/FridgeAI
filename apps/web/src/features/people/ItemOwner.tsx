import type { InventoryItemView, Owner } from '@fridgeai/core';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { OwnerBadge } from '../../ui/OwnerBadge';
import { OwnerChoice } from './OwnerChoice';
import { useMembers } from './use-members';

const t = messages.owner;

/**
 * «Gehört» on the item page, only with two or more people: who it is for, changeable, and a calm
 * line when it belongs to someone. Nothing is blocked: the mark is a courtesy (ADR-0058).
 */
export function ItemOwner({ item }: { item: InventoryItemView }) {
  const { householdId, ids, inventory } = useAppData();
  const members = useMembers();
  const [failed, setFailed] = useState(false);
  if (members === undefined || members.length < 2) {
    return null;
  }
  const owner = members.find((member) => member.id === item.owner);

  async function change(next: Owner) {
    setFailed(false);
    try {
      await inventory['inventory.updateItem']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        owner: next,
      });
    } catch {
      setFailed(true);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{t.legend}</h2>
        <p className="flex items-center gap-2 font-semibold">
          {owner === undefined ? (
            t.everyone
          ) : (
            <>
              <OwnerBadge initials={owner.initials} />
              {owner.displayName}
            </>
          )}
        </p>
      </div>
      <OwnerChoice
        members={members}
        value={owner === undefined ? 'shared' : item.owner}
        hideLegend
        onChange={(next) => {
          void change(next);
        }}
      />
      {owner === undefined ? null : (
        <p className="text-sm text-ink-muted">{t.ask(owner.displayName)}</p>
      )}
      <p role="status" className="text-sm text-today empty:hidden">
        {failed ? t.failed : ''}
      </p>
    </Card>
  );
}
