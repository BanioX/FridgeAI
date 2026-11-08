import { FileText, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { DEV_TOOLS } from '../../app/dev-tools';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { factFor } from '../knowledge/food-facts';
import { RettichGrowth } from './RettichGrowth';

const t = messages.today.intro;

/**
 * Start before the first item (Alban, 8.11.2026: «Wenn ich noch nichts drin hab sieht Start nach
 * nix aus»): the promise on the one onyx card with the two ways in, how Rettich works in three
 * steps, the Rettich that grows with every rescue, and a food fact of the day.
 */
export function StartIntro() {
  const { today } = useAppData();
  return (
    <>
      <Card variant="premium" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-silver uppercase">{t.eyebrow}</p>
          <h2 className="font-display text-2xl leading-tight font-semibold">{t.title}</h2>
          <p className="text-silver">{t.text}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            to="/add/receipt"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-onyx transition-colors hover:bg-oat"
          >
            <FileText size={20} aria-hidden="true" />
            {t.receipt}
          </Link>
          <Link
            to="/inventory/new"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Plus size={20} aria-hidden="true" />
            {t.item}
          </Link>
        </div>
        {DEV_TOOLS ? (
          <Link
            to="/dev/seed"
            className="inline-flex min-h-11 items-center font-semibold text-silver underline-offset-4 hover:underline"
          >
            {messages.today.loadDemo}
          </Link>
        ) : null}
      </Card>

      <section aria-labelledby="how-title" className="space-y-3">
        <h2 id="how-title" className="font-display text-xl font-semibold">
          {t.howTitle}
        </h2>
        <GroupedList>
          {t.steps.map((step, index) => (
            <GroupedListItem key={step.title}>
              <div className="flex items-start gap-4 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-onyx font-display text-sm font-semibold text-white tabular-nums"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-ink-muted">{step.text}</p>
                </div>
              </div>
            </GroupedListItem>
          ))}
        </GroupedList>
      </section>

      <Card className="space-y-3">
        <RettichGrowth rescues={0} />
        <p className="text-sm text-ink-muted">{t.growth}</p>
      </Card>

      <Card variant="tip">
        <strong>{messages.knowledge.didYouKnow}</strong> {factFor(today)}
      </Card>
    </>
  );
}
