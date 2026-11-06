import type { ReactNode } from 'react';

type CardVariant = 'default' | 'tip';

// Variants instead of className overrides: two Tailwind utilities for the same property
// do not reliably override each other by order in the class attribute.
const variantClasses: Record<CardVariant, string> = {
  default: 'border-line bg-surface shadow-card',
  tip: 'border-basil-200 bg-basil-50 text-basil-900',
};

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
}

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl border p-5 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
