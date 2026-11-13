import { ScanFace } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../ui/Button';
import { messages } from '../messages.de-CH';
import { useAppLock, type LockOutcome } from './lock-context';

const t = messages.appLock;

/** Full-screen view that takes the place of the app while it is locked. */
export function LockView() {
  const { unlock, resetup } = useAppLock();
  const heading = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Exclude<LockOutcome, 'ok'> | null>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function run(action: () => Promise<LockOutcome>) {
    setBusy(true);
    setProblem(null);
    const outcome = await action();
    // On success the view is gone and nothing is left to update.
    if (outcome !== 'ok') {
      setProblem(outcome);
      setBusy(false);
    }
  }

  return (
    <main
      aria-labelledby="lock-title"
      className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 bg-oat px-4 py-10 text-center text-ink"
    >
      <img src="/icon.svg" alt="" width={96} height={96} className="rounded-3xl shadow-card" />
      <div className="space-y-2">
        <h1 id="lock-title" ref={heading} tabIndex={-1} className="large-title outline-none">
          {t.lockedTitle}
        </h1>
        <p role="status" className="min-h-6 text-ink-muted">
          {problem === null ? '' : t.problem[problem]}
        </p>
      </div>
      <div className="w-full max-w-xs space-y-1">
        <Button fullWidth icon={ScanFace} disabled={busy} onClick={() => void run(unlock)}>
          {t.unlock}
        </Button>
        <p className="text-sm text-ink-muted">{t.unlockHint}</p>
      </div>
      <Button variant="ghost" disabled={busy} onClick={() => void run(resetup)}>
        {t.resetup}
      </Button>
    </main>
  );
}
