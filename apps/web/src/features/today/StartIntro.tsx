import { Camera, FileText, Plus, ScanBarcode, Sparkles, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { DEV_TOOLS } from '../../app/dev-tools';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { factFor } from '../knowledge/food-facts';
import { CameraInput } from '../../ui/CameraInput';
import { handOverPhoto } from '../photo/photo-handover';
import { RettichGrowth } from './RettichGrowth';

const t = messages.today.intro;

/** The smaller ways in on the onyx card: picture on top, two short lines below. */
const WAY =
  'flex min-h-21 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/20 px-1.5 py-2.5 text-center text-[0.8125rem] leading-tight font-semibold text-white transition-colors hover:bg-white/10';

function WayLink({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <Link to={to} className={WAY}>
      <Icon size={22} aria-hidden="true" />
      {label}
    </Link>
  );
}

/**
 * Start before the first item (Alban, 8.11.2026: «Wenn ich noch nichts drin hab sieht Start nach
 * nix aus»): the promise on the one onyx card with the ways in (receipt, photo, barcode, typing),
 * how Rettich works in three steps, the Rettich that grows with every rescue, and a food fact of
 * the day.
 */
export function StartIntro() {
  const { today } = useAppData();
  const navigate = useNavigate();
  return (
    <>
      <Card variant="premium" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-wide text-silver uppercase">{t.eyebrow}</p>
          <h2 className="font-display text-2xl leading-tight font-semibold">{t.title}</h2>
          <p className="text-silver">{t.text}</p>
        </div>
        {DEV_TOOLS ? (
          // Only in the previews (Alban, 12.11.2026): whoever gets a demo link should see at once
          // where to tap, so this is the one emerald button on the onyx card.
          <div className="space-y-1.5">
            <Link
              to="/dev/seed"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-basil-300 px-5 font-semibold text-onyx transition-colors hover:bg-basil-200"
            >
              <Sparkles size={20} aria-hidden="true" />
              {messages.today.loadDemo}
            </Link>
            <p className="text-sm text-silver">{messages.today.loadDemoHint}</p>
          </div>
        ) : null}
        <div className="space-y-2">
          <Link
            to="/add/receipt"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-onyx transition-colors hover:bg-oat"
          >
            <FileText size={20} aria-hidden="true" />
            {t.receipt}
          </Link>
          {/* Alban, 12.11.2026: Barcode and a photo straight from Start, next to typing. */}
          <ul aria-label={t.waysLabel} className="grid grid-cols-3 gap-2">
            <li className="grid">
              {/* A pack or a receipt: Rettich reads the photo and sees which it is (ADR-0068). */}
              <CameraInput
                className={WAY}
                onPhotos={([file]) => {
                  if (file !== undefined) {
                    handOverPhoto(file);
                    void navigate('/add/photo');
                  }
                }}
              >
                <Camera size={22} aria-hidden="true" />
                {t.photo}
              </CameraInput>
            </li>
            <li className="grid">
              <WayLink to="/inventory/new?scan=1" icon={ScanBarcode} label={t.barcode} />
            </li>
            <li className="grid">
              <WayLink to="/inventory/new" icon={Plus} label={t.item} />
            </li>
          </ul>
        </div>
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
        <RettichGrowth rescues={0} centered />
        <p className="text-center text-sm text-ink-muted">{t.growth}</p>
      </Card>

      <Card variant="tip">
        <strong>{messages.knowledge.didYouKnow}</strong> {factFor(today)}
      </Card>
    </>
  );
}
