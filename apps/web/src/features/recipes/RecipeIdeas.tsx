import { useLiveQuery } from 'dexie-react-hooks';
import { ChefHat, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';

const t = messages.recipes;

/** «Rezeptideen» on «Start» (plan 11c): up to three recipes that rescue what expires. */
export function RecipeIdeas() {
  const { householdId, recipes } = useAppData();
  const ideas = useLiveQuery(
    async () => (await recipes['recipes.suggest']({ householdId, limit: 3 })).recipes,
    [householdId],
  );
  if (ideas === undefined || ideas.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="ideas-title" className="space-y-3">
      <h2 id="ideas-title" className="text-xl font-semibold">
        {t.ideasTitle}
      </h2>
      <GroupedList>
        {ideas.map((idea) => (
          <GroupedListItem key={idea.id}>
            <Link to={`/recipes/${idea.id}`} className={GROUPED_ROW_LINK}>
              <div className="flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-basil-50 text-basil-700"
                >
                  <ChefHat size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{idea.title}</p>
                  <p className="text-sm text-ink-muted">
                    {t.rescues(idea.usesExpiring.join(', '), idea.minutes, idea.missing.length)}
                  </p>
                </div>
                <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted/60" />
              </div>
            </Link>
          </GroupedListItem>
        ))}
      </GroupedList>
    </section>
  );
}
