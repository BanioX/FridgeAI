import { categoryById, startOfMonth } from '@fridgeai/core';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { useMoney } from '../../app/money';
import { BackLink } from '../../ui/BackLink';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { co2e, food, formatNumber, land, text, water, type Quantity } from './climate-format';
import { FootprintBars, type BarRow } from './FootprintBars';
import { SINCE_START, useFootprint } from './use-footprint';

const t = messages.climate;

type Period = 'month' | 'all';
const PERIODS = [
  { value: 'month', label: t.periodMonth },
  { value: 'all', label: t.periodAll },
] as const;

const EXTERNAL_LINK = 'font-semibold text-basil-700 underline underline-offset-4';

const SOURCE_LINKS = [
  { label: t.sources.clark, href: 'https://www.pnas.org/doi/full/10.1073/pnas.2120584119' },
  { label: t.sources.owid, href: 'https://ourworldindata.org/environmental-impacts-of-food' },
  {
    label: t.sources.preisueberwacher,
    href: 'https://www.preisvergleiche.preisueberwacher.admin.ch/resource/pdf/Erlaeuterungen.pdf',
  },
  { label: t.sources.horgen, href: 'https://horgen.ch/_doc/4976437' },
  {
    label: t.sources.maur,
    href: 'https://www.maur.ch/verwaltung/dienstleistungen-az.html/5/print/pdf/service/529',
  },
] as const;

function Tile({ label, quantity }: { label: string; quantity: Quantity }) {
  return (
    <li className="min-w-0 rounded-xl bg-basil-50 p-3">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="font-display text-2xl font-semibold text-basil-800 tabular-nums">
        {quantity.value} <span className="text-base">{quantity.unit}</span>
      </p>
      <p className="text-sm text-basil-800">{t.rescuedWord}</p>
    </li>
  );
}

/**
 * «Klimabilanz» under «Mehr» (ADR-0057): what the rescued food weighed and what went into
 * making it (CO₂e, water, land), set against what was entsorgt, with the Kehricht estimate and
 * how it is calculated. Calm: it says what was in the food, never «klimaneutral».
 */
export function ClimatePage() {
  const { today } = useAppData();
  const money = useMoney();
  const [period, setPeriod] = useState<Period>('month');
  const footprint = useFootprint(period === 'month' ? startOfMonth(today) : SINCE_START, today);

  const none = (quantity: Quantity, value: number) => (value === 0 ? t.chartNone : text(quantity));
  const rows: BarRow[] =
    footprint === undefined
      ? []
      : [
          {
            key: 'food',
            label: t.metrics.food,
            rescued: footprint.rescued.grams,
            wasted: footprint.wasted.grams,
            rescuedText: none(food(footprint.rescued.grams), footprint.rescued.grams),
            wastedText: none(food(footprint.wasted.grams), footprint.wasted.grams),
          },
          {
            key: 'co2e',
            label: t.metrics.co2e,
            rescued: footprint.rescued.co2eGrams,
            wasted: footprint.wasted.co2eGrams,
            rescuedText: none(co2e(footprint.rescued.co2eGrams), footprint.rescued.co2eGrams),
            wastedText: none(co2e(footprint.wasted.co2eGrams), footprint.wasted.co2eGrams),
          },
          {
            key: 'water',
            label: t.metrics.water,
            rescued: footprint.rescued.waterLitres,
            wasted: footprint.wasted.waterLitres,
            rescuedText: none(water(footprint.rescued.waterLitres), footprint.rescued.waterLitres),
            wastedText: none(water(footprint.wasted.waterLitres), footprint.wasted.waterLitres),
          },
          {
            key: 'land',
            label: t.metrics.land,
            rescued: footprint.rescued.landM2,
            wasted: footprint.wasted.landM2,
            rescuedText: none(land(footprint.rescued.landM2), footprint.rescued.landM2),
            wastedText: none(land(footprint.wasted.landM2), footprint.wasted.landM2),
          },
        ];
  const hasData = footprint !== undefined && footprint.rescued.grams + footprint.wasted.grams > 0;
  const estimatedPercent =
    footprint === undefined || footprint.rescued.estimatedShare === 0
      ? null
      : Math.max(1, Math.round(100 * footprint.rescued.estimatedShare));

  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{t.title}</h1>
      </div>
      <p className="text-ink-muted">{t.intro}</p>

      <ChoiceChips
        legend={t.periodLegend}
        options={PERIODS}
        value={period}
        onChange={setPeriod}
        segmented
      />

      {footprint === undefined ? (
        <p className="sr-only">{messages.loading}</p>
      ) : !hasData ? (
        <Card variant="tip">{t.empty}</Card>
      ) : (
        <>
          <section aria-labelledby="climate-rescued" className="space-y-3">
            <h2 id="climate-rescued" className="font-display text-xl font-semibold">
              {t.tilesTitle}
            </h2>
            <ul className="grid grid-cols-2 gap-3">
              <Tile label={t.metrics.food} quantity={food(footprint.rescued.grams)} />
              <Tile label={t.metrics.co2e} quantity={co2e(footprint.rescued.co2eGrams)} />
              <Tile label={t.metrics.water} quantity={water(footprint.rescued.waterLitres)} />
              <Tile label={t.metrics.land} quantity={land(footprint.rescued.landM2)} />
            </ul>
            {estimatedPercent === null ? null : (
              <p className="text-sm text-ink-muted">{t.estimatedShare(estimatedPercent)}</p>
            )}
          </section>

          <section aria-labelledby="climate-chart" className="space-y-3">
            <h2 id="climate-chart" className="font-display text-xl font-semibold">
              {t.chartTitle}
            </h2>
            <Card>
              <FootprintBars rows={rows} />
            </Card>
          </section>

          {footprint.topCategories.length === 0 ? null : (
            <section aria-labelledby="climate-top" className="space-y-3">
              <h2 id="climate-top" className="font-display text-xl font-semibold">
                {t.topTitle}
              </h2>
              <Card>
                <ol className="space-y-2">
                  {footprint.topCategories.map((entry) => {
                    const category = categoryById(entry.categoryId);
                    return (
                      <li key={entry.categoryId} className="flex items-baseline gap-2">
                        <span aria-hidden="true">{category?.emoji}</span>
                        <span>
                          {t.topEntry(
                            category?.name.de ?? entry.categoryId,
                            text(co2e(entry.co2eGrams)),
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            </section>
          )}

          {footprint.kehricht === null ? null : (
            <section aria-labelledby="climate-waste" className="space-y-3">
              <h2 id="climate-waste" className="font-display text-xl font-semibold">
                {t.kehrichtTitle}
              </h2>
              <Card variant="tip" className="space-y-2">
                <p>
                  {t.kehricht(
                    formatNumber(footprint.kehricht.bags, 1),
                    money.format(footprint.kehricht.feeRappen),
                  )}
                </p>
                <p className="text-sm">{t.kehrichtNote}</p>
              </Card>
            </section>
          )}
        </>
      )}

      <section aria-labelledby="climate-method" className="space-y-3">
        <h2 id="climate-method" className="font-display text-xl font-semibold">
          {t.methodTitle}
        </h2>
        <Card className="space-y-3">
          {t.method.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Card>
        <h3 className="font-semibold">{t.sourcesTitle}</h3>
        <ul className="space-y-1">
          {SOURCE_LINKS.map((source) => (
            <li key={source.href}>
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${EXTERNAL_LINK} inline-flex min-h-11 items-center`}
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm text-ink-muted">{t.attribution}</p>
      </section>
    </div>
  );
}
