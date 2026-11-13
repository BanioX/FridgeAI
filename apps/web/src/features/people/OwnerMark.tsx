import { messages } from '../../app/messages.de-CH';
import { OwnerBadge } from '../../ui/OwnerBadge';
import { useMembers } from './use-members';

/**
 * The initials circle of the person an item belongs to, for list rows («Gehört Mia» for screen
 * readers). Only rendered for items with an owner, so rows without a mark cost nothing. Nothing
 * while loading or when the person is gone.
 */
export function OwnerMark({ ownerId }: { ownerId: string }) {
  const members = useMembers();
  const member = members?.find((candidate) => candidate.id === ownerId);
  if (member === undefined) {
    return null;
  }
  return (
    <OwnerBadge
      size="sm"
      initials={member.initials}
      label={messages.owner.badgeLabel(member.displayName)}
    />
  );
}
