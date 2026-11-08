import { z } from 'zod';
import { CurrencyCodeSchema, DEFAULT_CURRENCY, type CurrencyCode } from '../currency';
import { IdSchema } from '../ids';
import { IsoDateTimeSchema, syncFields, TimeOfDaySchema } from './primitives';

export const PlanSchema = z.enum(['free', 'pro']);
export type Plan = z.infer<typeof PlanSchema>;

export const HouseholdSchema = z.object({
  id: IdSchema,
  name: z.string().trim().min(1).max(60),
  plan: PlanSchema,
  /** ISO 4217 (ADR-0019). Missing on households from before 7.11.2026: they count in CHF. */
  currency: CurrencyCodeSchema.optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  deletedAt: IsoDateTimeSchema.optional(),
});
export type Household = z.infer<typeof HouseholdSchema>;

/** The household's currency; CHF for households from before the field existed. */
export function householdCurrency(household: Pick<Household, 'currency'>): CurrencyCode {
  return household.currency ?? DEFAULT_CURRENCY;
}

export const RoleSchema = z.enum(['owner', 'member']);
export type Role = z.infer<typeof RoleSchema>;

export const MemberSchema = z.object({
  ...syncFields,
  displayName: z.string().trim().min(1).max(40),
  role: RoleSchema,
  /** Opaque account ID; absent for local-only profiles without an account. */
  userId: z.string().min(1).max(128).optional(),
  joinedAt: IsoDateTimeSchema,
  leftAt: IsoDateTimeSchema.optional(),
});
export type Member = z.infer<typeof MemberSchema>;

export const ReminderPrefsSchema = z.object({
  ...syncFields,
  memberId: IdSchema,
  /** Local time of the daily «Retten-Digest». */
  digestTime: TimeOfDaySchema,
  /** Extra single reminders N days before expiry, e.g. [3, 1]. */
  daysBefore: z
    .array(z.int().min(0).max(14))
    .max(5)
    .refine((days) => new Set(days).size === days.length, 'Days must be unique'),
  quietHours: z.object({ start: TimeOfDaySchema, end: TimeOfDaySchema }),
  channels: z.object({ push: z.boolean(), inApp: z.boolean() }),
});
export type ReminderPrefs = z.infer<typeof ReminderPrefsSchema>;

/**
 * Rights per household (plan, section 2). `household:*` (export everything, delete everything)
 * belong to the household's own members only and can never be granted to a partner or AI.
 */
export const ScopeSchema = z.enum([
  'inventory:read',
  'inventory:write',
  'shopping_list:read',
  'shopping_list:write',
  'stats:read',
  'household:read',
  'household:write',
]);
export type Scope = z.infer<typeof ScopeSchema>;

/** What a partner app or MCP client may get, with consent (CLAUDE.md). */
export const GrantableScopeSchema = ScopeSchema.exclude(['household:read', 'household:write']);

/** A household's consent for an external client (partner app, MCP client) to access its data. */
export const GrantSchema = z.object({
  ...syncFields,
  clientId: z.string().min(1).max(128),
  scopes: z.array(GrantableScopeSchema).min(1),
  grantedBy: IdSchema,
  grantedAt: IsoDateTimeSchema,
  revokedAt: IsoDateTimeSchema.optional(),
});
export type Grant = z.infer<typeof GrantSchema>;
