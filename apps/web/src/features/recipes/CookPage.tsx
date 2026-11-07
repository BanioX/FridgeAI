import { fitsFeierabend } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { GroupedList } from '../../ui/GroupedList';
import { RecipeRow } from './RecipeIdeas';

const t = messages.recipes;

type CookFilter = 'rescue' | 'feierabend' | 'all';

/** The URL spells the filters in German: `?filter=feierabend` or `?filter=alle`; «Retten» is the default. */
const FILTER_PARAM: Record<CookFilter, string | undefined> = {
  rescue: undefined,
  feierabend: 'feierabend',
  all: 'alle',
};

const filters: { value: CookFilter; label: string }[] = (
  ['rescue', 'feierabend', 'all'] as const
).map((value) => ({ value, label: t.filters[value] }));

function filterFromParam(param: string | null): CookFilter {
  return (
    (Object.keys(FILTER_PARAM) as CookFilter[]).find((key) => FILTER_PARAM[key] === param) ??
    'rescue'
  );
}

interface Entry {
  id: string;
  title: string;
  detail: string;
}

/**
 * «Kochen» (ADR-0031): one recipe list with one choice. «Retten» (default) ranks the recipes that
 * use what expires soon, «Feierabend» shows what takes at most 15 minutes with nothing to buy,
 * «Alle» the whole collection, what works with the food at home first. The choice lives in the URL.
 */
export function CookPage() {
  const { householdId, recipes } = useAppData();
  const [params, setParams] = useSearchParams();
  const filter = filterFromParam(params.get('filter'));

  const entries = useLiveQuery(async (): Promise<Entry[]> => {
    if (filter === 'rescue') {
      const { recipes: ideas } = await recipes['recipes.suggest']({ householdId, limit: 10 });
      return ideas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        detail: t.rescues(idea.usesExpiring.join(', '), idea.minutes, idea.missing.length),
      }));
    }
    const { recipes: all } = await recipes['recipes.list']({ householdId });
    return (filter === 'feierabend' ? all.filter(fitsFeierabend) : all).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      detail: t.listDetail(recipe.minutes, recipe.missing.length, recipe.usesExpiring.join(', ')),
    }));
  }, [householdId, filter]);

  const choose = (value: CookFilter) => {
    const param = FILTER_PARAM[value];
    setParams(param === undefined ? {} : { filter: param }, { replace: true });
  };

  return (
    <div className="space-y-6 pb-8">
      <h1 className="large-title">{messages.pages.cook}</h1>
      <ChoiceChips
        legend={t.filterLegend}
        hideLegend
        segmented
        options={filters}
        value={filter}
        onChange={choose}
      />
      <section aria-label={t.listLabel}>
        {entries === undefined ? null : entries.length === 0 ? (
          <p className="text-ink-muted">{t.empty[filter]}</p>
        ) : (
          <GroupedList>
            {entries.map((entry) => (
              <RecipeRow key={entry.id} id={entry.id} title={entry.title} detail={entry.detail} />
            ))}
          </GroupedList>
        )}
      </section>
    </div>
  );
}
