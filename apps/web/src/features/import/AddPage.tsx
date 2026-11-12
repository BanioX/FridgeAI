import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronRight,
  PencilLine,
  Receipt,
  ScanBarcode,
  Soup,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { QuickAdd } from '../inventory/QuickAdd';

const t = messages.addHub;

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-basil-600';

/** A smaller way in: a white tile with its picture on top (Barcode, Von Hand). */
function Tile({
  to,
  icon: Icon,
  title,
  detail,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className={`flex min-h-36 flex-col justify-between gap-3 rounded-2xl bg-surface p-4 shadow-card transition-colors hover:bg-surface-muted ${FOCUS}`}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-surface-muted text-basil-700">
        <Icon size={24} aria-hidden="true" />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-muted">{detail}</span>
      </span>
    </Link>
  );
}

/**
 * «Erfassen» behind the ＋ tab (ADR-0031). Alban, 7.11.2026: simple and filling the space. The
 * receipt is the main way (everything at once), barcode and typing are the two smaller ones; the
 * household's usual products follow as one-tap chips. «Mit eigener KI» is gone (ADR-0012).
 */
export function AddPage() {
  const { householdId, inventory } = useAppData();
  const empty = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items.length === 0,
    [householdId, inventory],
  );
  return (
    <div className="space-y-5 pb-8">
      <h1 className="large-title">{messages.pages.add}</h1>

      <Link
        to="/add/receipt"
        className={`flex min-h-44 flex-col justify-between gap-4 rounded-2xl bg-basil-700 p-5 text-white shadow-float transition-colors hover:bg-basil-800 ${FOCUS}`}
      >
        <span className="flex items-center justify-between">
          <span className="flex size-12 items-center justify-center rounded-xl bg-white/15">
            <Receipt size={28} aria-hidden="true" />
          </span>
          <ChevronRight size={22} aria-hidden="true" className="text-white/80" />
        </span>
        <span>
          <span className="block text-2xl font-semibold tracking-tight">
            {messages.pages.receipt}
          </span>
          <span className="block text-white/85">{t.receipt}</span>
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          to="/inventory/new?scan=1"
          icon={ScanBarcode}
          title={messages.scanner.open}
          detail={t.barcode}
        />
        <Tile to="/inventory/new" icon={PencilLine} title={t.manualTitle} detail={t.manual} />
        <Tile
          to="/add/process?kind=leftover"
          icon={Soup}
          title={t.leftoversTitle}
          detail={t.leftovers}
        />
      </div>

      {empty === true ? (
        <Card variant="tip" className="text-sm">
          <p className="font-semibold">{t.startTitle}</p>
          <p className="mt-1">{t.start}</p>
        </Card>
      ) : null}

      <QuickAdd />
    </div>
  );
}
