import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ListPlus } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';

const t = messages.recipes;

interface Row {
  text: string;
  note: string;
  there: boolean;
  /** Missing and needed: shown in the warning colour. */
  needed: boolean;
}

function Rows({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <div className="space-y-2">
      <h3 className="px-4 text-sm font-semibold text-ink-muted uppercase">{title}</h3>
      <GroupedList>
        {rows.map((row) => (
          <GroupedListItem
            key={row.text}
            inset="check"
            className="flex items-center gap-3 px-4 py-2.5"
          >
            <span
              aria-hidden="true"
              className={`grid size-6 shrink-0 place-items-center rounded-full ${row.there ? 'bg-basil-700 text-white' : 'border border-line'}`}
            >
              {row.there ? <Check size={14} /> : null}
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{row.text}</p>
              <p
                className={`text-sm ${row.needed ? 'font-semibold text-today' : 'text-ink-muted'}`}
              >
                {row.note}
              </p>
            </div>
          </GroupedListItem>
        ))}
      </GroupedList>
    </div>
  );
}

/**
 * One recipe (ADR-0048): ingredients split into «Da» and «Fehlt» compared with the Vorrat, the
 * steps, and one tap that puts what is missing on the shopping list.
 */
export function RecipePage() {
  const { recipeId = '' } = useParams();
  const { householdId, ids, recipes, shopping } = useAppData();
  const recipe = useLiveQuery(
    async () => (await recipes['recipes.get']({ householdId, recipeId })).recipe,
    [householdId, recipeId],
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const back = <BackLink to="/knowledge" label={messages.pages.knowledge} />;
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

  const there: Row[] = [];
  const missing: Row[] = [];
  const toBuy: string[] = [];
  for (const ingredient of recipe.ingredients) {
    const home = ingredient.atHome.length > 0;
    if (home || ingredient.staple) {
      there.push({
        text: ingredient.text,
        note: home
          ? t.atHome([...new Set(ingredient.atHome.map((food) => food.name))].join(', '))
          : t.staple,
        there: true,
        needed: false,
      });
    } else {
      missing.push({
        text: ingredient.text,
        note: ingredient.optional ? t.optional : t.missing,
        there: false,
        needed: !ingredient.optional,
      });
      if (!ingredient.optional) {
        toBuy.push(ingredient.text);
      }
    }
  }

  async function toList() {
    if (busy) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      let added = 0;
      for (const name of toBuy) {
        const result = await shopping['shopping.addItem']({
          commandId: ids.next(),
          householdId,
          name,
        });
        added += result.alreadyOnList ? 0 : 1;
      }
      setStatus(t.onList(added));
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
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
        <Rows title={t.there} rows={there} />
        <Rows title={t.missing} rows={missing} />
        {toBuy.length > 0 ? (
          <Button
            variant="secondary"
            icon={ListPlus}
            fullWidth
            disabled={busy}
            onClick={() => void toList()}
          >
            {t.toList}
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
    </div>
  );
}
