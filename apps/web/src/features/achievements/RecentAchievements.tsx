import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { Medal } from '../../ui/Medal';
import { ACHIEVEMENT_ICONS } from './achievement-view';
import { newestFirst, useAchievements } from './use-achievements';

const t = messages.achievements;
const SHOWN = 3;

/** The three most recently unlocked achievements on Start; nothing until there is one. */
export function RecentAchievements() {
  const views = useAchievements();
  const newest = views === undefined ? [] : newestFirst(views).slice(0, SHOWN);
  if (newest.length === 0) {
    return null;
  }
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">{t.startTitle}</h2>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {newest.map((view) => (
          <li key={view.id} className="flex justify-center">
            <Medal
              icon={ACHIEVEMENT_ICONS[view.id]}
              look={view.look}
              name={view.name}
              label={view.label}
            />
          </li>
        ))}
      </ul>
      <Link
        to="/more/achievements"
        className="mt-2 -mb-1 inline-flex min-h-11 items-center gap-0.5 font-semibold text-basil-700"
      >
        {t.startAll}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  );
}
