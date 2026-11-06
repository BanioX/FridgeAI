import { Sprout } from 'lucide-react';
import type { ReactNode } from 'react';
import { messages } from '../../app/messages.de-CH';

interface PlaceholderPageProps {
  title: string;
  text?: string;
  children?: ReactNode;
}

export function PlaceholderPage({
  title,
  text = messages.placeholder,
  children,
}: PlaceholderPageProps) {
  return (
    <section>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <Sprout className="mt-0.5 shrink-0 text-basil-600" size={22} aria-hidden="true" />
        <div>
          <p className="text-ink-muted">{text}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
