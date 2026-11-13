import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { messages } from '../../app/messages.de-CH';

const t = messages.household;

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** `new-password` when choosing one (export), `current-password` when entering it (import). */
  autoComplete: 'new-password' | 'current-password';
  hint?: string | undefined;
  error?: string | undefined;
  autoFocus?: boolean;
}

/** One password field with a show/hide toggle; both are at least 44 px high. */
export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
  error,
  autoFocus = false,
}: PasswordFieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className={`min-h-12 min-w-0 flex-1 rounded-xl border bg-surface px-4 text-lg outline-none focus:border-basil-600 ${
            error ? 'border-today' : 'border-line'
          }`}
        />
        <button
          type="button"
          aria-label={shown ? t.passwordHide : t.passwordShow}
          aria-pressed={shown}
          onClick={() => {
            setShown(!shown);
          }}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-muted hover:bg-surface-muted"
        >
          {shown ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-today">
          {error}
        </p>
      ) : null}
    </div>
  );
}
