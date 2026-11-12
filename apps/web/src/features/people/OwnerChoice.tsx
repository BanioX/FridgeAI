import { OwnerSchema, type MemberView, type Owner } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { ChoiceChips } from '../../ui/ChoiceChips';

/**
 * «Gehört»: «Allen» (the default) or one person by name. Without a choice, food belongs to
 * everyone (ADR-0058).
 */
export function OwnerChoice({
  members,
  value,
  onChange,
  hideLegend = false,
}: {
  members: readonly MemberView[];
  value: Owner;
  onChange: (owner: Owner) => void;
  hideLegend?: boolean;
}) {
  return (
    <ChoiceChips
      legend={messages.owner.legend}
      hideLegend={hideLegend}
      value={value}
      options={[
        { value: 'shared', label: messages.owner.everyone },
        ...members.map((member) => ({ value: member.id, label: member.displayName })),
      ]}
      onChange={(chosen) => {
        const owner = OwnerSchema.safeParse(chosen);
        if (owner.success) {
          onChange(owner.data);
        }
      }}
    />
  );
}
