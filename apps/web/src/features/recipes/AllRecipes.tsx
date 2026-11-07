import { fitsFeierabend, type RecipeTag } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { GroupedList } from '../../ui/GroupedList';
import { RecipeRow } from './RecipeIdeas';

const t = messages.recipes;
type Filter = 'all' | 'feierabend' | RecipeTag;

const filters: { value: Filter; label: string }[] = (
  ['all', 'feierabend', 'schnell', 'vegetarisch', 'vegan', 'eiweissreich'] as const
).map((value) => ({ value, label: t.filters[value] }));

/**
 * «Alle Rezepte» on «Kochen» (ADR-0031): the whole collection, what can be cooked with the food at
 * home first, with one tap on «Feierabend» (at most 15 minutes, nothing to buy), «Schnell»,
 * «Vegetarisch», «Vegan» or «Eiweissreich».
 */
export function AllRecipes() {
  const { householdId, recipes } = useAppData();
  const [filter, setFilter] = useState<Filter>('all');
  const list = useLiveQuery(async () => {
    const all = (
      await recipes['recipes.list']({
        householdId,
        ...(filter === 'all' || filter === 'feierabend' ? {} : { tag: filter }),
      })
    ).recipes;
    return filter === 'feierabend' ? all.filter(fitsFeierabend) : all;
  }, [householdId, filter]);
  return (
    <section aria-labelledby="all-recipes-title" className="space-y-3">
      <h2 id="all-recipes-title" className="text-xl font-semibold">
        {t.allTitle}
      </h2>
      <ChoiceChips
        legend={t.filterLegend}
        hideLegend
        options={filters}
        value={filter}
        onChange={setFilter}
      />
      {list?.length === 0 && filter === 'feierabend' ? (
        <p className="text-ink-muted">{t.feierabendEmpty}</p>
      ) : null}
      {list === undefined || list.length === 0 ? null : (
        <GroupedList>
          {list.map((recipe) => (
            <RecipeRow
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              detail={t.listDetail(
                recipe.minutes,
                recipe.missing.length,
                recipe.usesExpiring.join(', '),
              )}
            />
          ))}
        </GroupedList>
      )}
    </section>
  );
}
