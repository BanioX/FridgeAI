import { useLiveQuery } from 'dexie-react-hooks';
import { ChefHat, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';

const t = messages.recipes;

/** One recipe in a grouped list: picture, title, one line, chevron; the whole row opens it. */
export function RecipeRow({ id, title, detail }: { id: string; title: string; detail: string }) {
  return (
    <GroupedListItem>
      <Link to={`/knowledge/recipes/${id}`} className={GROUPED_ROW_LINK}>
        <div className="flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-basil-700"
          >
            <ChefHat size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-ink-muted">{detail}</p>
          </div>
          <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted/60" />
        </div>
      </Link>
    </GroupedListItem>
  );
}

/** «Heute kochen»: up to three recipes that rescue what expires soon, most urgent first. */
export function CookToday({ limit = 3 }: { limit?: number }) {
  const { householdId, recipes } = useAppData();
  const ideas = useLiveQuery(
    async () => (await recipes['recipes.suggest']({ householdId, limit })).recipes,
    [householdId, limit],
  );
  if (ideas === undefined) {
    return null;
  }
  if (ideas.length === 0) {
    return <p className="px-4 text-ink-muted">{t.todayEmpty}</p>;
  }
  return (
    <GroupedList>
      {ideas.map((idea) => (
        <RecipeRow
          key={idea.id}
          id={idea.id}
          title={idea.title}
          detail={t.rescues(idea.usesExpiring.join(', '), idea.minutes, idea.missing.length)}
        />
      ))}
    </GroupedList>
  );
}
