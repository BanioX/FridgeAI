import {
  CONTRACT_V1,
  DomainEventSchema,
  type Clock,
  type DomainEvent,
  type Id,
  type IdGenerator,
  type OperationInput,
  type OperationName,
  type OperationOutput,
  type ProductCatalog,
} from '@fridgeai/core';
import type { Table } from 'dexie';
import type { FridgeDb } from './db';

export interface HandlerContext {
  db: FridgeDb;
  clock: Clock;
  ids: IdGenerator;
  /** The member acting (author of events and outcomes). */
  actor: Id;
  /** Open product databases for unknown barcodes (Open Food Facts); none = household only. */
  catalog?: ProductCatalog;
}

export type Handler<TName extends OperationName> = (
  input: OperationInput<TName>,
) => Promise<OperationOutput<TName>>;

export type CommandErrorCode =
  | 'not_found'
  | 'not_active'
  | 'invalid_quantity'
  | 'unsuitable_location'
  | 'already_open'
  | 'already_undone';

export class CommandError extends Error {
  readonly code: CommandErrorCode;

  constructor(code: CommandErrorCode, message: string) {
    super(message);
    this.name = 'CommandError';
    this.code = code;
  }
}

/**
 * What every local command needs (ADR-0005): one transaction over the given tables, idempotency
 * by commandId (a repeated command returns the stored result) and domain events with actor and
 * time. `tables` must include `db.events` and `db.commands`.
 */
export function createCommandKit(ctx: HandlerContext, tables: Table[]) {
  const { db, clock, ids, actor } = ctx;

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
    return db.transaction('rw', tables, async () => {
      const done = await db.commands.get(commandId);
      if (done !== undefined) {
        return CONTRACT_V1[name].output.parse(done.result) as OperationOutput<TName>;
      }
      const result = await execute();
      await db.commands.add({ commandId, operation: name, result, at: clock.now() });
      return result;
    });
  }

  return { event, runCommand };
}
