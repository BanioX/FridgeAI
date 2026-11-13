import { formatSwissDate, toLocalDate, type Id } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';

const t = messages.feedback;

/** «Deine Rückmeldungen» (ADR-0089): the saved answers, each one deletable. Hidden when empty. */
export function FeedbackList() {
  const { householdId, ids, inventory } = useAppData();
  const data = useLiveQuery(() => inventory['feedback.list']({ householdId }), [householdId]);
  const [removed, setRemoved] = useState(false);
  if (data === undefined || (data.answers.length === 0 && !removed)) {
    return null;
  }
  const remove = async (feedbackId: Id) => {
    await inventory['feedback.delete']({ commandId: ids.next(), householdId, feedbackId });
    setRemoved(true);
  };
  return (
    <section aria-labelledby="feedback-title" className="space-y-3">
      <h2 id="feedback-title" className="font-display text-xl font-semibold">
        {t.listTitle}
      </h2>
      <p className="text-ink-muted">{t.listText}</p>
      {data.answers.length === 0 ? null : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {data.answers.map((answer) => {
            const date = formatSwissDate(toLocalDate(answer.at));
            return (
              <li key={answer.id} className="flex items-start gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ink-muted">{date}</span>
                  <span className="block break-words">{answer.text}</span>
                </span>
                <button
                  type="button"
                  aria-label={t.remove(date)}
                  onClick={() => void remove(answer.id)}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted"
                >
                  <Trash2 size={20} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {removed ? (
        <p role="status" className="text-sm text-ink-muted">
          {t.removed}
        </p>
      ) : null}
    </section>
  );
}
