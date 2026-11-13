import { z } from 'zod';
import { IsoDateTimeSchema, syncFields } from './primitives';

/**
 * One answer to «Was hat dich gestört?» (ADR-0089): only the text and when, on this device and in
 * the export. A deleted answer keeps no text.
 */
export const FeedbackSchema = z.object({
  ...syncFields,
  text: z.string().trim().max(500),
  at: IsoDateTimeSchema,
});
export type Feedback = z.infer<typeof FeedbackSchema>;
