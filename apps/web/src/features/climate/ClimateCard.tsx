import { startOfMonth } from '@fridgeai/core';
import { ChevronRight, Leaf } from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { co2e, food, text, water } from './climate-format';
import { SINCE_START, useFootprint } from './use-footprint';

const t = messages.climate;

/**
 * «Klimabilanz» on Start (ADR-0057): in one line what the rescued food of the month weighs and
 * what went into making it, with a link to the full view. Hidden until something was rescued; if
 * the month has nothing yet but earlier months do, it says «Bisher gerettet».
 */
export function ClimateCard() {
  const { today } = useAppData();
  const month = useFootprint(startOfMonth(today), today);
  const sinceStart = useFootprint(SINCE_START, today);
  if (month === undefined || sinceStart === undefined) {
    return null;
  }
  const shown = month.rescued.grams > 0 ? month : sinceStart.rescued.grams > 0 ? sinceStart : null;
  if (shown === null) {
    return null;
  }
  const { rescued } = shown;
  return (
    <Card className="space-y-2">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        <Leaf size={20} aria-hidden="true" className="text-basil-700" />
        {t.title}
      </h2>
      <p>
        <span className="font-semibold">
          {shown === month ? t.cardMonth : t.cardSoFar}
          {': '}
        </span>
        {[
          `${text(food(rescued.grams))} ${t.metrics.food}`,
          text(co2e(rescued.co2eGrams)),
          `${text(water(rescued.waterLitres))} ${t.metrics.water}`,
        ].join(' · ')}
      </p>
      <Link
        to="/more/climate"
        className="-mb-1 inline-flex min-h-11 items-center gap-0.5 font-semibold text-basil-700"
      >
        {t.cardLink}
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </Card>
  );
}
