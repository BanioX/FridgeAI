interface BigNumberProps {
  value: string;
  label: string;
}

/** Large display figure, e.g. the CHF value in the fridge or the amount saved. */
export function BigNumber({ value, label }: BigNumberProps) {
  return (
    <div>
      <p className="font-display text-4xl font-semibold tracking-tight text-basil-800 tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-ink-muted">{label}</p>
    </div>
  );
}
