import { CONTRACT_V1 } from '../contract/operations';
import { initialsOf } from '../initials';
import type { Id } from '../ids';
import { MemberSchema, type Member } from '../model/household';
import { InventoryItemSchema } from '../model/inventory';
import { CommandError, createCommandKit, type AppContext, type UseCase } from './command';

const isActive = (member: Member) => member.leftAt === undefined && member.deletedAt === undefined;

/**
 * The people of a household (ADR-0058): a name per person, no account. Items can belong to
 * one of them («Gehört»); without a mark they belong to everyone.
 */
export function createMemberUseCases(ctx: AppContext) {
  const { storage, clock, ids, actor } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

  async function activeMembers(householdId: Id): Promise<Member[]> {
    const members = await storage.members.ofHousehold(householdId);
    return members
      .filter(isActive)
      .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.id.localeCompare(b.id));
  }

  async function activeMember(householdId: Id, memberId: Id): Promise<Member> {
    const member = await storage.members.get(memberId);
    if (member?.householdId !== householdId || !isActive(member)) {
      throw new CommandError('not_found', `Member ${memberId} not found`);
    }
    return member;
  }

  const sameName = (a: string, b: string) =>
    a.trim().toLocaleLowerCase('de-CH') === b.trim().toLocaleLowerCase('de-CH');

  const list: UseCase<'household.members'> = async (raw) => {
    const input = CONTRACT_V1['household.members'].input.parse(raw);
    const members = await activeMembers(input.householdId);
    return CONTRACT_V1['household.members'].output.parse({
      members: members.map((member) => ({
        id: member.id,
        displayName: member.displayName,
        initials: initialsOf(
          member.displayName,
          members.filter((other) => other.id !== member.id).map((other) => other.displayName),
        ),
        role: member.role,
        isSelf: member.id === actor,
      })),
    });
  };

  const addMember: UseCase<'household.addMember'> = async (raw) => {
    const input = CONTRACT_V1['household.addMember'].input.parse(raw);
    return runCommand('household.addMember', input.commandId, async () => {
      const members = await activeMembers(input.householdId);
      if (members.some((member) => sameName(member.displayName, input.displayName))) {
        throw new CommandError('duplicate_name', `A person named ${input.displayName} exists`);
      }
      const now = clock.now();
      const member = MemberSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        displayName: input.displayName,
        role: 'member',
        joinedAt: now,
        updatedAt: now,
      });
      await storage.members.add(member);
      await storage.events.append(
        event(input.householdId, 'member.added', { memberId: member.id }),
      );
      return { memberId: member.id };
    });
  };

  const renameMember: UseCase<'household.renameMember'> = async (raw) => {
    const input = CONTRACT_V1['household.renameMember'].input.parse(raw);
    return runCommand('household.renameMember', input.commandId, async () => {
      const member = await activeMember(input.householdId, input.memberId);
      const others = (await activeMembers(input.householdId)).filter(
        (other) => other.id !== member.id,
      );
      if (others.some((other) => sameName(other.displayName, input.displayName))) {
        throw new CommandError('duplicate_name', `A person named ${input.displayName} exists`);
      }
      if (member.displayName !== input.displayName) {
        await storage.members.put(
          MemberSchema.parse({
            ...member,
            displayName: input.displayName,
            updatedAt: clock.now(),
          }),
        );
        await storage.events.append(
          event(input.householdId, 'member.renamed', { memberId: member.id }),
        );
      }
      return { memberId: member.id };
    });
  };

  const removeMember: UseCase<'household.removeMember'> = async (raw) => {
    const input = CONTRACT_V1['household.removeMember'].input.parse(raw);
    return runCommand('household.removeMember', input.commandId, async () => {
      const member = await activeMember(input.householdId, input.memberId);
      const members = await activeMembers(input.householdId);
      if (member.role === 'owner') {
        throw new CommandError('cannot_remove', 'The owner of the household cannot be removed');
      }
      if (member.id === actor) {
        throw new CommandError('cannot_remove', 'The person using this device cannot be removed');
      }
      if (members.length <= 1) {
        throw new CommandError('cannot_remove', 'The last person cannot be removed');
      }
      const now = clock.now();
      await storage.members.put(MemberSchema.parse({ ...member, leftAt: now, updatedAt: now }));
      // What they owned belongs to everyone now; outcomes keep their snapshot (history).
      const items = (await storage.items.ofHousehold(input.householdId)).filter(
        (item) => item.owner === member.id,
      );
      for (const item of items) {
        await storage.items.put(
          InventoryItemSchema.parse({ ...item, owner: 'shared', updatedAt: now }),
        );
      }
      await storage.events.append(
        event(input.householdId, 'member.removed', {
          memberId: member.id,
          itemsShared: items.length,
        }),
      );
      return { memberId: member.id, itemsShared: items.length };
    });
  };

  return {
    'household.members': list,
    'household.addMember': addMember,
    'household.renameMember': renameMember,
    'household.removeMember': removeMember,
  };
}
