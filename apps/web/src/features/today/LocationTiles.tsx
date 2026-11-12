import { Link } from 'react-router';
import { messages } from '../../app/messages.de-CH';
import { locationStyle } from '../../ui/LocationTile';
import { toneClasses } from '../../ui/tones';
import type { LocationCount } from './location-counts';

const t = messages.today.locationTiles;

/**
 * Four square tiles on «Start», one per storage location: the number of articles, and a small
 * badge when something there needs attention. A tap opens that tab of the Vorrat. The tiles are
 * links that read as one sentence («Kühlschrank: 12 Artikel, 2 bald fällig»); the visible parts
 * are hidden from screen readers so nothing is read twice.
 */
export function LocationTiles({ counts }: { counts: readonly LocationCount[] }) {
  return (
    <section aria-labelledby="location-tiles-title">
      <h2 id="location-tiles-title" className="sr-only">
        {t.title}
      </h2>
      <ul className="grid grid-cols-4 gap-2">
        {counts.map(({ location, items, urgent }) => {
          const { icon: Icon, classes } = locationStyle[location];
          const label = messages.locations[location];
          return (
            <li key={location} className="flex">
              <Link
                to={`/inventory?location=${location}`}
                className={`relative flex aspect-square w-full min-w-0 flex-col justify-between rounded-2xl p-2 shadow-card transition-transform active:scale-95 ${classes}`}
              >
                <span className="sr-only">{t.label(label, items, urgent)}</span>
                <span aria-hidden="true" className="flex items-start justify-between gap-1 p-0.5">
                  <Icon size={20} strokeWidth={1.75} />
                  {urgent > 0 ? (
                    <span
                      className={`min-w-5 rounded-full px-1.5 text-center text-xs leading-5 font-semibold tabular-nums ${toneClasses.today.chip}`}
                    >
                      {urgent}
                    </span>
                  ) : null}
                </span>
                <span aria-hidden="true" className="min-w-0 px-0.5">
                  <span
                    className={`block font-display text-2xl leading-none font-semibold tabular-nums ${items === 0 ? 'opacity-60' : 'text-ink'}`}
                  >
                    {items}
                  </span>
                  <span className="mt-1 block text-[0.6875rem] leading-tight font-semibold tracking-tight break-words hyphens-auto">
                    {label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
