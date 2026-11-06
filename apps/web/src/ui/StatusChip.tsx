import type { ReactNode } from 'react';
import { toneClasses, type Tone } from './tones';

interface StatusChipProps {
  tone: Tone;
  children: ReactNode;
}

export function StatusChip({ tone, children }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] leading-none font-semibold whitespace-nowrap ${toneClasses[tone].chip}`}
    >
      {children}
    </span>
  );
}
