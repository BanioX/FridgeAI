import { Lock } from 'lucide-react';
import { useState } from 'react';
import { messages } from '../../app/messages.de-CH';
import { useAppLock, type LockOutcome } from '../../app/lock/lock-context';
import type { LockAfter } from '../../app/lock/lock-settings';
import { ChoiceChips } from '../../ui/ChoiceChips';

const t = messages.appLock;

/** «App-Sperre» in «Deine Daten»: optional lock with Face ID, Touch ID or the device code (ADR-0086). */
export function AppLockSection() {
  const lock = useAppLock();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const unavailable = lock.available === false && !lock.enabled;

  async function toggle() {
    setBusy(true);
    setStatus('');
    const turningOn = !lock.enabled;
    const outcome: LockOutcome = await (turningOn ? lock.enable() : lock.disable());
    setStatus(outcome === 'ok' ? (turningOn ? t.switchedOn : t.switchedOff) : t.problem[outcome]);
    setBusy(false);
  }

  return (
    <section aria-labelledby="lock-section-title" className="space-y-3">
      <h2
        id="lock-section-title"
        className="flex items-center gap-2 font-display text-xl font-semibold"
      >
        <Lock size={22} aria-hidden="true" className="text-basil-700" />
        {t.title}
      </h2>
      <p className="text-ink-muted">{t.text}</p>
      <p className="text-ink-muted">{t.privacy}</p>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <span id="lock-switch-label" className="font-semibold">
          {t.switchLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={lock.enabled}
          aria-labelledby="lock-switch-label"
          disabled={busy || unavailable}
          onClick={() => void toggle()}
          className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-basil-600 disabled:opacity-50 ${
            lock.enabled ? 'border-basil-700 bg-basil-700' : 'border-line bg-surface-muted'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-card transition-transform ${
              lock.enabled ? 'translate-x-6' : ''
            }`}
          />
        </button>
      </div>
      {unavailable ? <p className="text-sm text-ink-muted">{t.unavailable}</p> : null}
      {lock.enabled ? (
        <>
          <ChoiceChips<LockAfter>
            legend={t.after}
            segmented
            value={lock.after}
            onChange={lock.setAfter}
            options={[
              { value: 'now', label: t.afterNow },
              { value: '1m', label: t.after1m },
              { value: '5m', label: t.after5m },
            ]}
          />
          <p className="text-sm text-ink-muted">{t.turnOffHint}</p>
        </>
      ) : null}
      <p role="status" className="font-semibold text-basil-800">
        {status}
      </p>
    </section>
  );
}
