import {
  categoryById,
  fallbackCategory,
  normalizeFoodText,
  portionChoices,
  portioningOf,
  type Id,
  type InventoryItemView,
} from '@fridgeai/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { formatQuantity } from '../../ui/quantity-text';
import type { ClosedItem } from '../inventory/closed-item';
import { portionLabel } from '../inventory/portion-labels';
import { problemWith, processPrefillFrom, resultFor, type ResultChoice } from './process-state';

const t = messages.process;

/** How much of an item goes in: the index of a portion choice; the last one is «alles». */
type Amounts = ReadonlyMap<Id, number | null>;

function portionsOf(item: InventoryItemView) {
  const category = categoryById(item.categoryId) ?? fallbackCategory();
  return portionChoices(item.quantity, item.unit, portioningOf(category).splits);
}

/**
 * «Verarbeiten» (ADR-0052, Alban 11.11.2026): choose what goes in, say what comes out. Reached from
 * an item («Verarbeiten»), the Erfassen hub («Reste erfassen», `?kind=leftover`) and a recipe
 * («Gekocht», prefilled through the router state). The value of the ingredients moves along.
 */
export function ProcessPage() {
  const { householdId, ids, inventory } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const prefill = processPrefillFrom(location.state);
  const fromRecipe = prefill !== null;

  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId, inventory],
  );
  const [picked, setPicked] = useState<Amounts | null>(null);
  const [search, setSearch] = useState('');
  const [choice, setChoice] = useState<ResultChoice>(
    fromRecipe ? 'none' : params.get('kind') === 'leftover' ? 'leftover' : 'made',
  );
  const [typedName, setTypedName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [tried, setTried] = useState(false);

  const back = <BackLink to="/add" label={messages.pages.add} />;
  if (items === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }

  // Set up once the stock is known: the item of the link, or what the recipe has at home.
  const start: Amounts = new Map(
    [params.get('item'), ...(prefill?.itemIds ?? [])]
      .filter((id): id is string => id !== null)
      .flatMap((id) => (items.some((item) => item.id === id) ? [[id as Id, null] as const] : [])),
  );
  const amounts = picked ?? start;
  const itemOf = (id: Id) => items.find((item) => item.id === id);
  const name =
    typedName ??
    (prefill === null ? '' : choice === 'leftover' ? t.leftoverName(prefill.title) : prefill.title);
  const problem = problemWith(choice, name, amounts.size);
  const visible = items.filter(
    (item) =>
      search.trim() === '' || normalizeFoodText(item.name).includes(normalizeFoodText(search)),
  );

  function toggle(id: Id) {
    const next = new Map(amounts);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.set(id, null);
    }
    setPicked(next);
  }

  function setAmount(id: Id, index: number | null) {
    setPicked(new Map(amounts).set(id, index));
  }

  async function save() {
    setTried(true);
    if (busy || problem !== null) {
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const ingredients = [...amounts].flatMap(([id, index]) => {
        const item = itemOf(id);
        const portion = item === undefined || index === null ? undefined : portionsOf(item)[index];
        return item === undefined
          ? []
          : [
              {
                itemId: id,
                // «Alles» is the default: no quantity, the whole item goes in.
                ...(portion === undefined || portion.kind === 'all'
                  ? {}
                  : { quantity: portion.quantity }),
              },
            ];
      });
      const result = resultFor(choice, name);
      const done = await inventory['inventory.process']({
        commandId: ids.next(),
        householdId,
        ingredients,
        ...(result === undefined ? {} : { result: { ...result, location: 'fridge' as const } }),
        ...(prefill === null ? {} : { recipeId: prefill.recipeId }),
      });
      const closed: ClosedItem = {
        kind: 'processed',
        name: result?.name ?? '',
        outcomeIds: done.outcomeIds,
        ...(done.resultItemId === undefined ? {} : { resultItemId: done.resultItemId }),
        location: 'fridge',
      };
      void navigate('/inventory?location=fridge', { state: { closed } });
    } catch {
      setStatus(t.failed);
      setBusy(false);
    }
  }

  const resultOptions: { value: ResultChoice; label: string }[] = fromRecipe
    ? [
        { value: 'leftover', label: t.yes },
        { value: 'none', label: t.no },
      ]
    : [
        { value: 'made', label: t.made },
        { value: 'leftover', label: t.leftover },
      ];

  return (
    <div className="space-y-6 pb-8">
      {back}
      <div>
        <h1 className="large-title">{t.title}</h1>
        <p className="mt-1 text-ink-muted">{fromRecipe ? prefill.title : t.intro}</p>
      </div>

      <section aria-labelledby="process-ingredients" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="process-ingredients" className="text-xl font-semibold">
            {t.ingredients}
          </h2>
          <p className="text-sm text-ink-muted" role="status">
            {t.chosen(amounts.size)}
          </p>
        </div>
        {items.length === 0 ? (
          <p className="text-ink-muted">{t.nothingAtHome}</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label htmlFor="process-search" className="block text-sm font-semibold">
                {t.search}
              </label>
              <input
                id="process-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                autoComplete="off"
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus:border-basil-600"
              />
            </div>
            {visible.length === 0 ? (
              <p className="text-ink-muted">{t.noMatch}</p>
            ) : (
              <GroupedList>
                {visible.map((item) => {
                  const chosen = amounts.has(item.id);
                  return (
                    <GroupedListItem key={item.id} inset="check" className="px-0 py-0">
                      <button
                        type="button"
                        aria-pressed={chosen}
                        onClick={() => {
                          toggle(item.id);
                        }}
                        className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-basil-600"
                      >
                        <span
                          aria-hidden="true"
                          className={`grid size-6 shrink-0 place-items-center rounded-full ${chosen ? 'bg-basil-700 text-white' : 'border border-line'}`}
                        >
                          {chosen ? <Check size={14} /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{item.name}</span>
                          <span className="block text-sm text-ink-muted">
                            {formatQuantity(item.quantity, item.unit)}
                          </span>
                        </span>
                      </button>
                    </GroupedListItem>
                  );
                })}
              </GroupedList>
            )}
          </>
        )}
      </section>

      {[...amounts].flatMap(([id, index]) => {
        const item = itemOf(id);
        if (item === undefined) {
          return [];
        }
        const choices = portionsOf(item);
        if (choices.length < 2) {
          return [];
        }
        return [
          <ChoiceChips
            key={id}
            legend={t.howMuch(item.name)}
            options={choices.map((choiceOf, position) => ({
              value: String(position),
              label: portionLabel(choiceOf, item.unit),
            }))}
            value={String(index ?? choices.length - 1)}
            onChange={(value) => {
              setAmount(id, Number(value));
            }}
          />,
        ];
      })}

      <section aria-labelledby="process-out" className="space-y-4">
        <h2 id="process-out" className="sr-only">
          {t.comesOut}
        </h2>
        <ChoiceChips
          legend={fromRecipe ? t.leftoversQuestion : t.comesOut}
          options={resultOptions}
          value={choice}
          onChange={(value) => {
            setChoice(value);
            setTypedName(null);
          }}
          segmented
        />
        {choice === 'none' ? null : (
          <div className="space-y-1.5">
            <label htmlFor="process-name" className="block text-sm font-semibold">
              {t.name}
            </label>
            <input
              id="process-name"
              value={name}
              onChange={(event) => {
                setTypedName(event.target.value);
              }}
              maxLength={120}
              autoComplete="off"
              placeholder={t.namePlaceholder}
              aria-invalid={tried && problem === 'name'}
              className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 outline-none focus:border-basil-600"
            />
          </div>
        )}
      </section>

      <p role="status" className="min-h-6 font-semibold text-today">
        {status !== ''
          ? status
          : tried && problem === 'name'
            ? t.needName
            : tried && problem === 'ingredients'
              ? t.needIngredients
              : ''}
      </p>
      <Button
        fullWidth
        disabled={busy}
        onClick={() => {
          void save();
        }}
      >
        {t.save}
      </Button>
    </div>
  );
}
