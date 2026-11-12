import { ACHIEVEMENT_FAMILIES } from '@fridgeai/core';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Card } from '../../ui/Card';
import { Medal } from '../../ui/Medal';
import { ACHIEVEMENT_ICONS } from './achievement-view';
import { useAchievements } from './use-achievements';

const t = messages.achievements;

/**
 * «Abzeichen» under «Mehr» (docs/abzeichen.md): every achievement by family, reached ones as
 * medals, open ones dashed with what is still missing. No ranking, no comparison.
 */
export function AchievementsPage() {
  const views = useAchievements();
  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{messages.pages.achievements}</h1>
      </div>
      <p className="text-ink-muted">{t.intro}</p>
      {views === undefined ? (
        <p className="sr-only">{messages.loading}</p>
      ) : (
        ACHIEVEMENT_FAMILIES.map((family) => (
          <section key={family} aria-labelledby={`family-${family}`} className="space-y-3">
            <h2 id={`family-${family}`} className="font-display text-xl font-semibold">
              {t.families[family]}
            </h2>
            <Card>
              <ul className="grid grid-cols-3 gap-x-2 gap-y-5">
                {views
                  .filter((view) => view.state.family === family)
                  .map((view) => (
                    <li key={view.id} className="flex justify-center">
                      <Medal
                        icon={ACHIEVEMENT_ICONS[view.id]}
                        look={view.look}
                        fraction={view.fraction}
                        name={view.name}
                        label={view.label}
                        missing={view.missing}
                        about={view.about}
                      />
                    </li>
                  ))}
              </ul>
            </Card>
          </section>
        ))
      )}
    </div>
  );
}
