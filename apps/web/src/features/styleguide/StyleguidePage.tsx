import { Leaf, PencilLine, ScanLine } from 'lucide-react';
import { BigNumber } from '../../ui/BigNumber';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ItemRow } from '../../ui/ItemRow';
import { LocationTile } from '../../ui/LocationTile';
import { StatusChip } from '../../ui/StatusChip';
import type { Tone } from '../../ui/tones';

/*
 * Development-only reference of the design system (route /styleguide, see routes.tsx).
 * The strings below are sample data, not product copy, and never ship in production builds.
 */
const sampleItems: { emoji: string; name: string; meta: string; tone: Tone; label: string }[] = [
  {
    emoji: '🍗',
    name: 'Pouletbrust',
    meta: '300 g · Kühlschrank',
    tone: 'danger',
    label: 'Nicht mehr essen',
  },
  { emoji: '🥛', name: 'Vollmilch', meta: '1 l · Kühlschrank', tone: 'today', label: 'heute' },
  { emoji: '🥬', name: 'Blattspinat', meta: '250 g · Kühlschrank', tone: 'soon', label: 'morgen' },
  {
    emoji: '🧀',
    name: 'Mozzarella',
    meta: '1 Stk. · Kühlschrank · gehört Lena',
    tone: 'soon',
    label: 'in 3 Tagen',
  },
  { emoji: '🍞', name: 'Ruchbrot', meta: '500 g · Vorrat', tone: 'fresh', label: 'in 5 Tagen' },
  { emoji: '🫛', name: 'Erbsen', meta: '750 g · Tiefkühler', tone: 'ice', label: 'bis März' },
];

// Full class names so Tailwind can detect them (no string concatenation).
const basilScale = [
  'bg-basil-50',
  'bg-basil-100',
  'bg-basil-200',
  'bg-basil-300',
  'bg-basil-400',
  'bg-basil-500',
  'bg-basil-600',
  'bg-basil-700',
  'bg-basil-800',
  'bg-basil-900',
] as const;

export function StyleguidePage() {
  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-semibold tracking-wide text-basil-600 uppercase">Styleguide</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Heute retten</h1>
      </header>

      <Card>
        <BigNumber value="CHF 42.80" label="liegen gerade in eurem Kühlschrank" />
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Läuft bald ab</h2>
        <ul className="space-y-2.5">
          {sampleItems.map((item) => (
            <li key={item.name}>
              <ItemRow
                emoji={item.emoji}
                name={item.name}
                meta={item.meta}
                status={{ tone: item.tone, label: item.label }}
              />
            </li>
          ))}
        </ul>
      </section>

      <Card variant="tip" className="flex items-start gap-3">
        <Leaf className="mt-0.5 shrink-0 text-basil-600" size={22} aria-hidden="true" />
        <p>
          <strong>Oft noch gut:</strong> Schauen, riechen, probieren. Das Mindesthaltbarkeitsdatum
          ist kein Wegwerfdatum.
        </p>
      </Card>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Lagerorte</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <LocationTile location="fridge" label="Kühlschrank" countLabel="12 Artikel" />
          <LocationTile location="freezer" label="Tiefkühler" countLabel="7 Artikel" />
          <LocationTile location="pantry" label="Vorrat" countLabel="23 Artikel" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Aktionen</h2>
        <Button icon={ScanLine} fullWidth>
          Bon scannen
        </Button>
        <Button icon={PencilLine} variant="secondary" fullWidth>
          Manuell erfassen
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Status</h2>
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="fresh">frisch</StatusChip>
          <StatusChip tone="soon">in 2 Tagen</StatusChip>
          <StatusChip tone="today">heute</StatusChip>
          <StatusChip tone="danger">Nicht mehr essen</StatusChip>
          <StatusChip tone="ice">eingefroren</StatusChip>
          <StatusChip tone="wheat">Vorrat</StatusChip>
          <StatusChip tone="neutral">geteilt</StatusChip>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Basilikum</h2>
        <div className="flex overflow-hidden rounded-xl border border-line">
          {basilScale.map((swatch) => (
            <div key={swatch} className={`h-12 flex-1 ${swatch}`} title={swatch} />
          ))}
        </div>
      </section>
    </div>
  );
}
