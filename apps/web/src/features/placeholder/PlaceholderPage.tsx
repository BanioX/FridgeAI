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
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      <p className="mt-2 text-neutral-700">{text}</p>
      {children}
    </section>
  );
}
