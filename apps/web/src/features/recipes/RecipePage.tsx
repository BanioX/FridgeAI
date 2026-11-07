import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ListPlus } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { CookedBooking } from './CookedBooking';
import { usedFood } from './cooked';

const t = messages.recipes;

/** One recipe (plan 11c): what is at home, what is missing, and the steps. */
export function RecipePage() {
  const { recipeId = '' } = useParams();
  const { householdId, ids, recipes, shopping } = useAppData();
  const recipe = useLiveQuery(
    async () => (await recipes['recipes.get']({ householdId, recipeId })).recipe,
    [householdId, recipeId],
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const back = <BackLink to="/cook" label={messages.pages.cook} />;
  if (recipe === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  if (recipe === null) {
    return (
      <div className="space-y-4">
        {back}
        <p>{t.notFound}</p>
      </div>
    );
  }

  const missing = recipe.ingredients.filter(
    (ingredient) => !ingredient.staple && !ingredient.optional && ingredient.atHome.length === 0,
  );

  async function toList() {
    if (busy) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      for (const ingredient of missing) {
        await shopping['shopping.addItem']({
          commandId: ids.next(),
          householdId,
          name: ingredient.text,
        });
      }
      setStatus(t.onList(missing.length));
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {back}
      <div>
        <h1 className="large-title">{recipe.title}</h1>
        <p className="mt-1 text-ink-muted">
          {[t.minutes(recipe.minutes), t.servings(recipe.servings), ...recipe.tags].join(' · ')}
        </p>
      </div>

      <section aria-labelledby="ingredients-title" className="space-y-3">
        <h2 id="ingredients-title" className="text-xl font-semibold">
          {t.ingredients}
        </h2>
        <GroupedList>
          {recipe.ingredients.map((ingredient) => {
            const there = ingredient.atHome.length > 0;
            const note = there
              ? t.atHome([...new Set(ingredient.atHome.map((food) => food.name))].join(', '))
              : ingredient.staple
                ? t.staple
                : ingredient.optional
                  ? t.optional
                  : t.missing;
            return (
              <GroupedListItem
                key={ingredient.text}
                inset="check"
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full ${there ? 'bg-basil-700 text-white' : 'border border-line'}`}
                >
                  {there ? <Check size={14} /> : null}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{ingredient.text}</p>
                  <p
                    className={`text-sm ${there || ingredient.staple || ingredient.optional ? 'text-ink-muted' : 'font-semibold text-today'}`}
                  >
                    {note}
                  </p>
                </div>
              </GroupedListItem>
            );
          })}
        </GroupedList>
        {missing.length > 0 ? (
          <Button
            variant="secondary"
            icon={ListPlus}
            fullWidth
            disabled={busy}
            onClick={() => void toList()}
          >
            {t.toList(missing.length)}
          </Button>
        ) : null}
        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>
      </section>

      <section aria-labelledby="steps-title" className="space-y-3">
        <h2 id="steps-title" className="text-xl font-semibold">
          {t.steps}
        </h2>
        <ol className="list-decimal space-y-2 pl-6 marker:font-semibold marker:text-basil-700">
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <CookedBooking food={usedFood(recipe.ingredients)} />
    </div>
  );
}
