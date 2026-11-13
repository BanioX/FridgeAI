import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { ScoreRing } from '../../ui/ScoreRing';
import { CookToday, OwnRecipes } from '../recipes/RecipeIdeas';
import { factFor } from './food-facts';
import { describeDays, shelfGuide, type GuideEntry } from './shelf-guide';
import { FoodIcon } from '../../ui/FoodIcon';

const t = messages.knowledge;
const r = messages.recipes;

function Entry({ entry }: { entry: GuideEntry }) {
  const level = t.levels[entry.level];
  const summary = [
    entry.keeps === null
      ? null
      : t.keeps(describeDays(entry.keeps.days), messages.locations[entry.keeps.at]),
    entry.openedDays === undefined ? null : t.opened(describeDays(entry.openedDays)),
  ]
    .filter((part) => part !== null)
    .join(' · ');
  return (
    <details className="group">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 has-focus-visible:outline-2 has-focus-visible:outline-basil-600 [&::-webkit-details-marker]:hidden">
        <FoodIcon categoryId={entry.id} />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{entry.name}</span>
          <span className="block text-sm text-ink-muted">{summary}</span>
        </span>
        <ScoreRing score={entry.score} label={t.scoreLabel(entry.score, level)} />
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="shrink-0 text-ink-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-2 px-4 pb-4 pl-[4.25rem] text-sm">
        <p className="font-semibold">
          {entry.freezerDays === null ? t.noFreezer : t.freezer(describeDays(entry.freezerDays))}
        </p>
        <ul className="list-disc space-y-1 pl-4 text-ink-muted">
          {entry.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/**
 * «Wissen» (ADR-0041): short explanations of the dates and of storing food, and «Haltbarkeit
 * A–Z» from the catalog with the shelf score, the days open and frozen, and the tips.
 */
export function KnowledgePage() {
  const { today } = useAppData();
  const searchId = useId();
  const [query, setQuery] = useState('');
  const groups = shelfGuide(query);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="large-title">{messages.pages.knowledge}</h1>
        <p className="mt-1 text-ink-muted">{t.intro}</p>
      </div>

      {/* Recipes come in under «Wissen», not as a sixth tab (ADR-0048). */}
      <section aria-labelledby={`${searchId}-recipes`} className="space-y-3">
        <h2 id={`${searchId}-recipes`} className="font-display text-xl font-semibold">
          {r.title}
        </h2>
        <h3 className="px-4 text-sm font-semibold text-ink-muted uppercase">{r.todayTitle}</h3>
        <CookToday />
        <OwnRecipes />
        <GroupedList>
          <GroupedListItem>
            <Link to="/knowledge/recipes" className={GROUPED_ROW_LINK}>
              <div className="flex min-h-15 items-center gap-3 py-2.5 pr-3 pl-4">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-basil-700"
                >
                  <BookOpen size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.allTitle}</p>
                  <p className="text-sm text-ink-muted">{r.allText}</p>
                </div>
                <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-ink-muted/60" />
              </div>
            </Link>
          </GroupedListItem>
        </GroupedList>
      </section>

      {/* One food fact a day (ADR-0042), the same as after a rescue on that seed. */}
      <Card variant="tip">
        <p>
          <strong>{t.didYouKnow}</strong> {factFor(today)}
        </p>
      </Card>

      <section aria-labelledby={`${searchId}-explain`} className="space-y-3">
        <h2 id={`${searchId}-explain`} className="font-display text-xl font-semibold">
          {t.explainTitle}
        </h2>
        <GroupedList>
          {t.explain.map((item) => (
            <GroupedListItem key={item.title} inset="text">
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-basil-600 [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{item.title}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-4 pb-4 text-ink-muted">{item.text}</p>
              </details>
            </GroupedListItem>
          ))}
        </GroupedList>
      </section>

      <section aria-labelledby={`${searchId}-everyday`} className="space-y-3">
        <h2 id={`${searchId}-everyday`} className="font-display text-xl font-semibold">
          {t.everydayTitle}
        </h2>
        <GroupedList>
          {t.everyday.map((item) => (
            <GroupedListItem key={item.title} inset="text">
              <details className="group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-basil-600 [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{item.title}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-4 pb-4 text-ink-muted">{item.text}</p>
              </details>
            </GroupedListItem>
          ))}
        </GroupedList>
      </section>

      <section aria-labelledby={`${searchId}-guide`} className="space-y-3">
        <h2 id={`${searchId}-guide`} className="font-display text-xl font-semibold">
          {t.guideTitle}
        </h2>
        <label htmlFor={searchId} className="sr-only">
          {t.search}
        </label>
        <div className="relative">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            id={searchId}
            type="search"
            autoComplete="off"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            className="min-h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-lg outline-none focus:border-basil-600"
          />
        </div>
        {groups.length === 0 ? <p className="text-ink-muted">{t.noMatch}</p> : null}
        {groups.map(({ group, entries }) => (
          <div key={group} className="space-y-2">
            <h3 className="px-4 text-sm font-semibold text-ink-muted uppercase">
              {t.groups[group]}
            </h3>
            <GroupedList>
              {entries.map((entry) => (
                <GroupedListItem key={entry.id}>
                  <Entry entry={entry} />
                </GroupedListItem>
              ))}
            </GroupedList>
          </div>
        ))}
      </section>
    </div>
  );
}
