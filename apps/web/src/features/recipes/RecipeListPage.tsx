import { useLiveQuery } from 'dexie-react-hooks';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { GroupedList } from '../../ui/GroupedList';
import { OwnRecipes, RecipeRow } from './RecipeIdeas';

const t = messages.recipes;

/** «Alle Rezepte» (ADR-0048): the whole collection, what the Vorrat covers best first. */
export function RecipeListPage() {
  const { householdId, recipes } = useAppData();
  const list = useLiveQuery(
    async () => (await recipes['recipes.list']({ householdId })).recipes,
    [householdId],
  );
  if (list === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  const curated = list.filter((entry) => entry.source === 'curated');
  return (
    <div className="space-y-4 pb-8">
      <BackLink to="/knowledge" label={messages.pages.knowledge} />
      <div>
        <h1 className="large-title">{t.allTitle}</h1>
        <p className="mt-1 text-ink-muted">{t.listIntro}</p>
      </div>
      <OwnRecipes />
      {curated.length === 0 ? (
        <p className="text-ink-muted">{t.empty}</p>
      ) : (
        <GroupedList>
          {curated.map((entry) => (
            <RecipeRow
              key={entry.id}
              id={entry.id}
              title={entry.title}
              detail={t.listDetail(
                entry.minutes,
                entry.missing.length,
                entry.usesExpiring.join(', '),
              )}
            />
          ))}
        </GroupedList>
      )}
    </div>
  );
}
