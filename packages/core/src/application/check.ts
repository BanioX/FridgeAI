import { CONTRACT_V1 } from '../contract/operations';
import { createCommandKit, type AppContext, type UseCase } from './command';

/**
 * «Kühlschrank-Check» finished (ADR-0054): the check itself uses the normal outcome commands; this
 * only records that one was walked through, as the local event `check.completed` for «Treu».
 */
export function createCheckCommands(ctx: AppContext) {
  const { event, runCommand } = createCommandKit(ctx);

  const complete: UseCase<'inventory.completeCheck'> = async (raw) => {
    const input = CONTRACT_V1['inventory.completeCheck'].input.parse(raw);
    return runCommand('inventory.completeCheck', input.commandId, async () => {
      await ctx.storage.events.append(
        event(input.householdId, 'check.completed', { itemCount: input.itemCount }),
      );
      return { completedOn: ctx.clock.today() };
    });
  };

  return { 'inventory.completeCheck': complete };
}
