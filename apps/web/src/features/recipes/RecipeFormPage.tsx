import { cleanRecipeLines } from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useId, useState, type SyntheticEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';

const t = messages.recipes;
const f = t.form;

const fieldClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-surface px-4 py-3 text-lg outline-none focus:border-basil-600 ${
    invalid ? 'border-today' : 'border-line'
  }`;

interface Initial {
  title: string;
  minutes: string;
  servings: string;
  ingredients: string;
  steps: string;
}

const EMPTY: Initial = { title: '', minutes: '', servings: '', ingredients: '', steps: '' };

const lines = (text: string) => text.split(/\r\n|\r|\n/);

/** `''` is «not given»; anything else must be a whole number above zero. */
function wholeNumber(text: string): number | undefined | 'invalid' {
  const value = text.trim();
  if (value === '') {
    return undefined;
  }
  return /^\d{1,4}$/.test(value) && Number(value) > 0 ? Number(value) : 'invalid';
}

/**
 * «Neues Rezept» and «Rezept bearbeiten» (ADR-0048, point 7): title, minutes, portions and two
 * boxes with one line per ingredient and per step. A recipe pasted from anywhere works: the use
 * case trims, drops empty lines and strips bullets and numbers.
 */
export function RecipeFormPage() {
  const { recipeId } = useParams();
  const { householdId, recipes } = useAppData();
  const existing = useLiveQuery(
    async () =>
      recipeId === undefined
        ? null
        : (await recipes['recipes.get']({ householdId, recipeId })).recipe,
    [householdId, recipeId],
  );
  const back = <BackLink to="/knowledge/recipes" label={t.back} />;
  if (existing === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  if (recipeId !== undefined && existing?.source !== 'own') {
    return (
      <div className="space-y-4">
        {back}
        <p>{t.notFound}</p>
      </div>
    );
  }
  const initial: Initial =
    existing === null
      ? EMPTY
      : {
          title: existing.title,
          minutes: existing.minutes === undefined ? '' : String(existing.minutes),
          servings: existing.servings === undefined ? '' : String(existing.servings),
          ingredients: existing.ingredients.map((ingredient) => ingredient.text).join('\n'),
          steps: existing.steps.join('\n'),
        };
  // Keyed by id so the form starts from the recipe's values once they are loaded.
  return (
    <div className="space-y-4 pb-8">
      {back}
      <h1 className="large-title">{recipeId === undefined ? t.newTitle : t.editTitle}</h1>
      <RecipeForm key={recipeId ?? 'new'} recipeId={recipeId} initial={initial} />
    </div>
  );
}

function RecipeForm({ recipeId, initial }: { recipeId: string | undefined; initial: Initial }) {
  const { householdId, ids, recipeCommands } = useAppData();
  const navigate = useNavigate();
  const id = useId();
  const [title, setTitle] = useState(initial.title);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [servings, setServings] = useState(initial.servings);
  const [ingredients, setIngredients] = useState(initial.ingredients);
  const [steps, setSteps] = useState(initial.steps);
  const [error, setError] = useState<{ field: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: SyntheticEvent) {
    event.preventDefault();
    if (busy) {
      return;
    }
    const minutesValue = wholeNumber(minutes);
    const servingsValue = wholeNumber(servings);
    if (title.trim() === '') {
      setError({ field: 'title', text: f.needTitle });
    } else if (cleanRecipeLines([ingredients]).length === 0) {
      setError({ field: 'ingredients', text: f.needIngredients });
    } else if (minutesValue === 'invalid') {
      setError({ field: 'minutes', text: f.needNumber });
    } else if (servingsValue === 'invalid') {
      setError({ field: 'servings', text: f.needNumber });
    } else {
      setError(null);
      setBusy(true);
      const input = {
        householdId,
        title,
        ...(minutesValue === undefined ? {} : { minutes: minutesValue }),
        ...(servingsValue === undefined ? {} : { servings: servingsValue }),
        ingredients: lines(ingredients),
        steps: lines(steps),
      };
      try {
        const saved =
          recipeId === undefined
            ? (await recipeCommands['recipes.create']({ commandId: ids.next(), ...input })).recipeId
            : (await recipeCommands['recipes.update']({
                commandId: ids.next(),
                recipeId,
                ...input,
              }),
              recipeId);
        void navigate(`/knowledge/recipes/${saved}`, { replace: true });
      } catch {
        setError({ field: 'form', text: t.failed });
        setBusy(false);
      }
    }
  }

  const invalid = (field: string) => error?.field === field;
  const describedBy = (field: string, hint?: string) =>
    [invalid(field) ? `${id}-error` : undefined, hint].filter(Boolean).join(' ') || undefined;

  return (
    <form onSubmit={(event) => void save(event)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-title`} className="font-semibold">
          {f.title}
        </label>
        <input
          id={`${id}-title`}
          value={title}
          maxLength={120}
          autoComplete="off"
          aria-invalid={invalid('title')}
          aria-describedby={describedBy('title')}
          onChange={(event) => {
            setTitle(event.target.value);
          }}
          className={`min-h-12 ${fieldClass(invalid('title'))}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-minutes`} className="font-semibold">
            {f.minutes}
          </label>
          <input
            id={`${id}-minutes`}
            value={minutes}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={invalid('minutes')}
            aria-describedby={describedBy('minutes')}
            onChange={(event) => {
              setMinutes(event.target.value);
            }}
            className={`min-h-12 tabular-nums ${fieldClass(invalid('minutes'))}`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-servings`} className="font-semibold">
            {f.servings}
          </label>
          <input
            id={`${id}-servings`}
            value={servings}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={invalid('servings')}
            aria-describedby={describedBy('servings')}
            onChange={(event) => {
              setServings(event.target.value);
            }}
            className={`min-h-12 tabular-nums ${fieldClass(invalid('servings'))}`}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-ingredients`} className="font-semibold">
          {f.ingredients}
        </label>
        <p id={`${id}-ingredients-hint`} className="text-sm text-ink-muted">
          {f.ingredientsHint}
        </p>
        <textarea
          id={`${id}-ingredients`}
          value={ingredients}
          rows={7}
          aria-invalid={invalid('ingredients')}
          aria-describedby={describedBy('ingredients', `${id}-ingredients-hint`)}
          onChange={(event) => {
            setIngredients(event.target.value);
          }}
          className={fieldClass(invalid('ingredients'))}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-steps`} className="font-semibold">
          {f.steps}
        </label>
        <p id={`${id}-steps-hint`} className="text-sm text-ink-muted">
          {f.stepsHint}
        </p>
        <textarea
          id={`${id}-steps`}
          value={steps}
          rows={7}
          aria-describedby={`${id}-steps-hint`}
          onChange={(event) => {
            setSteps(event.target.value);
          }}
          className={fieldClass(false)}
        />
      </div>

      <p id={`${id}-error`} role="alert" className="font-semibold text-today">
        {error?.text}
      </p>
      <Button type="submit" fullWidth disabled={busy}>
        {f.save}
      </Button>
    </form>
  );
}
