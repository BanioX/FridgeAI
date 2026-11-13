import { addDays, shouldAskFeedback, toLocalDate, type LocalDate } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useId, useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

const t = messages.feedback;
const MAX = 500;
const SNOOZE_DAYS = 3;
/** Device-local: «Später» and «Nicht mehr fragen», not in the export (SE-31). */
const ASK_KEY = 'fridgeai:feedback-ask';

interface AskChoice {
  snoozedUntil?: LocalDate;
  never?: boolean;
}

function readChoice(): AskChoice {
  try {
    const raw = window.localStorage.getItem(ASK_KEY);
    return raw === null ? {} : (JSON.parse(raw) as AskChoice);
  } catch {
    return {};
  }
}

function writeChoice(choice: AskChoice) {
  try {
    window.localStorage.setItem(ASK_KEY, JSON.stringify(choice));
  } catch {
    // Storage blocked: the card hides for this visit only.
  }
}

/**
 * «Eine Frage» (ADR-0089): after a week of use, Start asks what bothered the person. The answer
 * stays on the device; it leaves it only inside an export the person makes.
 */
export function FeedbackQuestion() {
  const { householdId, ids, inventory, today } = useAppData();
  const fieldId = useId();
  const data = useLiveQuery(() => inventory['feedback.list']({ householdId }), [householdId]);
  const [choice, setChoice] = useState(readChoice);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  if (data === undefined) {
    return null;
  }
  if (saved) {
    return (
      <Card>
        <p role="status">{t.thanks}</p>
      </Card>
    );
  }
  const last = data.answers[0];
  const ask = shouldAskFeedback({
    firstUseOn: data.firstUseOn,
    today,
    never: choice.never === true,
    ...(last === undefined ? {} : { lastAnsweredOn: toLocalDate(last.at) }),
    ...(choice.snoozedUntil === undefined ? {} : { snoozedUntil: choice.snoozedUntil }),
  });
  if (!ask) {
    return null;
  }
  const choose = (next: AskChoice) => {
    writeChoice(next);
    setChoice(next);
  };
  const save = async () => {
    setBusy(true);
    try {
      await inventory['feedback.save']({ commandId: ids.next(), householdId, text });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <section aria-labelledby={`${fieldId}-title`} className="space-y-3">
        <h2 id={`${fieldId}-title`} className="font-display text-xl font-semibold">
          {t.title}
        </h2>
        <label htmlFor={fieldId} className="block font-semibold">
          {t.question}
        </label>
        <textarea
          id={fieldId}
          value={text}
          maxLength={MAX}
          rows={3}
          aria-describedby={`${fieldId}-count`}
          onChange={(event) => {
            setText(event.target.value);
          }}
          className="w-full rounded-xl border border-line bg-surface p-3 text-ink"
        />
        <p id={`${fieldId}-count`} className="text-right text-sm text-ink-muted">
          {t.count(text.length, MAX)}
        </p>
        <Button fullWidth disabled={busy || text.trim() === ''} onClick={() => void save()}>
          {t.save}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              choose({ snoozedUntil: addDays(today, SNOOZE_DAYS) });
            }}
          >
            {t.later}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              choose({ never: true });
            }}
          >
            {t.never}
          </Button>
        </div>
      </section>
    </Card>
  );
}
