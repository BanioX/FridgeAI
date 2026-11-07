interface BigNumberProps {
  value: string;
  label: string;
  /** On the dark «premium» card: white figure, silver label. */
  onDark?: boolean;
}

/** Large display figure, e.g. the CHF value in the fridge or the amount saved. */
export function BigNumber({ value, label, onDark = false }: BigNumberProps) {
  return (
    <div>
      <p
        className={`font-display text-4xl font-semibold tracking-tight tabular-nums ${onDark ? 'text-white' : 'text-basil-800'}`}
      >
        {value}
      </p>
      <p className={`mt-1 ${onDark ? 'text-silver' : 'text-ink-muted'}`}>{label}</p>
    </div>
  );
}
