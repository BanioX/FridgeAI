import { LockOpen } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { PasswordField } from './PasswordField';

const t = messages.household;

interface UnlockBackupProps {
  fileName: string;
  /** Resolves `true` when the password opened the file, `false` when it did not fit. */
  onUnlock: (password: string) => Promise<boolean>;
  onCancel: () => void;
}

/** Import step for a protected backup: ask for the password, a wrong one is a calm retry. */
export function UnlockBackup({ fileName, onUnlock, onCancel }: UnlockBackupProps) {
  const [password, setPassword] = useState('');
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: SyntheticEvent) {
    event.preventDefault();
    if (password === '' || busy) {
      return;
    }
    setBusy(true);
    setWrong(false);
    try {
      if (!(await onUnlock(password))) {
        setWrong(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-3">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <p className="font-semibold">{t.importLocked(fileName)}</p>
        <PasswordField
          label={t.password}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setWrong(false);
          }}
          autoComplete="current-password"
          error={wrong ? t.wrongPassword : undefined}
          autoFocus
        />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" icon={LockOpen} disabled={busy || password === ''}>
            {t.importUnlock}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            {t.deleteCancel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
