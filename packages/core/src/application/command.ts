import { DomainEventSchema, type DomainEvent } from '../contract/events';
import {
  CONTRACT_V1,
  type OperationInput,
  type OperationName,
  type OperationOutput,
} from '../contract/operations';
import type { Id } from '../ids';
import type { Clock, IdGenerator, ProductCatalog, ProductSearch } from '../ports';
import type { Storage } from '../ports/storage';

/**
 * What every use case gets (ADR-0034): storage and the outside world only through ports, so the
 * same code runs in the browser (Dexie) and later on a server (PostgreSQL).
 */
export interface AppContext {
  storage: Storage;
  clock: Clock;
  ids: IdGenerator;
  /** The member acting (author of events and outcomes). */
  actor: Id;
  /** Open product databases for unknown barcodes (Open Food Facts); none = household only. */
  catalog?: ProductCatalog;
  /** Name search in open databases; none = household only. */
  search?: ProductSearch;
  /** Name search in the catalog shipped with the app, on the device (ADR-0045). */
  localSearch?: ProductSearch;
}

/** One contract operation, implemented. */
export type UseCase<TName extends OperationName> = (
  input: OperationInput<TName>,
) => Promise<OperationOutput<TName>>;

export type CommandErrorCode =
  | 'not_found'
  | 'not_active'
  | 'invalid_quantity'
  | 'unsuitable_location'
  | 'already_open'
  | 'already_undone'
  | 'unknown_category'
  | 'invalid_owner'
  | 'duplicate_name'
  | 'cannot_remove';

export class CommandError extends Error {
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, message: string) {
    super(message);
    this.name = 'CommandError';
    this.code = code;
  }
}

/**
 * What every command needs (ADR-0005): one transaction, idempotency by commandId (a repeated
 * command returns the stored result) and domain events with actor and time.
 */
export function createCommandKit({ storage, clock, ids, actor }: AppContext) {
  function event<TType extends DomainEvent['type']>(
    householdId: Id,
    type: TType,
    payload: Extract<DomainEvent, { type: TType }>['payload'],
  ): DomainEvent {
    return DomainEventSchema.parse({
      id: ids.next(),
      type,
      version: 1,
      householdId,
      actor,
      at: clock.now(),
      payload,
    });
  }

  async function runCommand<TName extends OperationName>(
    name: TName,
    commandId: Id,
    execute: () => Promise<OperationOutput<TName>>,
  ): Promise<OperationOutput<TName>> {
    return storage.transaction(async () => {
      const done = await storage.commands.find(commandId);
      if (done !== undefined) {
        return CONTRACT_V1[name].output.parse(done.result) as OperationOutput<TName>;
      }
      const result = await execute();
      await storage.commands.record({ commandId, operation: name, result, at: clock.now() });
      return result;
    });
  }

  return { event, runCommand };
}
