import { CONTRACT_V1 } from '../contract/operations';
import { toLocalDate } from '../dates';
import { FeedbackSchema } from '../model/feedback';
import { CommandError, createCommandKit, type AppContext, type UseCase } from './command';

/**
 * The one question after a week (ADR-0089), ADR-0034 layer 2. Answers stay on the device and in
 * the export; deleting one removes its text, not only marks it.
 */
export function createFeedbackUseCases(ctx: AppContext) {
  const { storage, clock, ids } = ctx;
  const { event, runCommand } = createCommandKit(ctx);

  const list: UseCase<'feedback.list'> = async (raw) => {
    const input = CONTRACT_V1['feedback.list'].input.parse(raw);
    const [household, rows] = await Promise.all([
      storage.households.get(input.householdId),
      storage.feedback.ofHousehold(input.householdId),
    ]);
    if (household === undefined) {
      throw new CommandError('not_found', `Household ${input.householdId} not found`);
    }
    const answers = rows
      .filter((row) => row.deletedAt === undefined)
      .sort((a, b) => b.at.localeCompare(a.at))
      .map(({ id, text, at }) => ({ id, text, at }));
    return { firstUseOn: toLocalDate(household.createdAt), answers };
  };

  const save: UseCase<'feedback.save'> = async (raw) => {
    const input = CONTRACT_V1['feedback.save'].input.parse(raw);
    return runCommand('feedback.save', input.commandId, async () => {
      const now = clock.now();
      const row = FeedbackSchema.parse({
        id: ids.next(),
        householdId: input.householdId,
        text: input.text,
        at: now,
        updatedAt: now,
      });
      await storage.feedback.add(row);
      await storage.events.append(
        event(input.householdId, 'feedback.saved', { feedbackId: row.id }),
      );
      return { feedbackId: row.id };
    });
  };

  const remove: UseCase<'feedback.delete'> = async (raw) => {
    const input = CONTRACT_V1['feedback.delete'].input.parse(raw);
    return runCommand('feedback.delete', input.commandId, async () => {
      const row = await storage.feedback.get(input.feedbackId);
      if (row?.householdId !== input.householdId || row.deletedAt !== undefined) {
        return { deleted: false };
      }
      const now = clock.now();
      await storage.feedback.put(
        FeedbackSchema.parse({ ...row, text: '', deletedAt: now, updatedAt: now }),
      );
      await storage.events.append(
        event(input.householdId, 'feedback.deleted', { feedbackId: row.id }),
      );
      return { deleted: true };
    });
  };

  return { 'feedback.list': list, 'feedback.save': save, 'feedback.delete': remove };
}
