import { Package, Refrigerator, Snowflake, type LucideIcon } from 'lucide-react';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

const locationStyle: Record<StorageLocation, { icon: LucideIcon; classes: string }> = {
  fridge: { icon: Refrigerator, classes: 'bg-basil-50 text-basil-700' },
  freezer: { icon: Snowflake, classes: 'bg-ice-bg text-ice' },
  pantry: { icon: Package, classes: 'bg-wheat-bg text-wheat' },
};

interface LocationTileProps {
  location: StorageLocation;
  label: string;
  countLabel: string;
}

export function LocationTile({ location, label, countLabel }: LocationTileProps) {
  const { icon: Icon, classes } = locationStyle[location];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span className={`flex size-10 items-center justify-center rounded-xl ${classes}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-ink-muted">{countLabel}</p>
      </div>
    </div>
  );
}
