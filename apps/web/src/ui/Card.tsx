import type { ReactNode } from 'react';

type CardVariant = 'default' | 'tip' | 'premium';

// Variants instead of className overrides: two Tailwind utilities for the same property
// do not reliably override each other by order in the class attribute.
const variantClasses: Record<CardVariant, string> = {
  default: 'border-transparent bg-surface shadow-card',
  tip: 'border-transparent bg-basil-50 text-basil-900',
  /* The one dark card per page (the value on Start): Onyx with a hairline of silver. */
  premium: 'border-white/10 bg-onyx text-white shadow-float',
};

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  /** `compact` for a card that holds one line, such as the value on Start. */
  padding?: 'normal' | 'compact';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  padding = 'normal',
  className = '',
}: CardProps) {
  const inner = padding === 'compact' ? 'px-4 py-3' : 'p-5';
  return (
    <div className={`rounded-2xl border ${inner} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
