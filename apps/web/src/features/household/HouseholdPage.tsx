import { Download, FileSpreadsheet, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ReportCard } from '../reports/ReportCard';
import { exportFileName, inventoryCsv, saveFile } from './export-files';

const t = messages.household;

/**
 * «Daten und Datenschutz» under «Mehr»: the person's data (export as JSON or CSV, delete
 * everything, ADR-0020) and privacy in plain words. Sharing with flatmates arrives with accounts
 * (step 7).
 */
export function HouseholdPage() {
  const { householdId, ids, inventory, household, today } = useAppData();
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>) {
    setBusy(true);
    setStatus('');
    try {
      const message = await action();
      if (message !== null) {
        setStatus(message);
      }
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  const exportJson = () =>
    run(async () => {
      const data = await household['household.export']({ householdId });
      const name = exportFileName(today, 'json');
      saveFile(name, 'application/json', `${JSON.stringify(data, null, 2)}\n`);
      return t.exported(name);
    });

  const exportCsv = () =>
    run(async () => {
      const { items } = await inventory['inventory.list']({ householdId });
      const name = exportFileName(today, 'csv');
      saveFile(name, 'text/csv;charset=utf-8', inventoryCsv(items));
      return t.exported(name);
    });

  const deleteAll = () =>
    run(async () => {
      await household['household.delete']({ commandId: ids.next(), householdId, confirm: true });
      // A fresh start: the app creates a new, empty local household.
      window.location.assign('/');
      return null;
    });

  return (
    <div className="space-y-6">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{messages.pages.data}</h1>
      </div>

      <ReportCard />

      <section aria-labelledby="data-title" className="space-y-3">
        <h2 id="data-title" className="font-display text-xl font-semibold">
          {t.data}
        </h2>
        <p className="text-ink-muted">{t.dataText}</p>
        <Button
          variant="secondary"
          icon={Download}
          fullWidth
          disabled={busy}
          onClick={() => void exportJson()}
        >
          {t.exportJson}
        </Button>
        <Button
          variant="secondary"
          icon={FileSpreadsheet}
          fullWidth
          disabled={busy}
          onClick={() => void exportCsv()}
        >
          {t.exportCsv}
        </Button>
        {confirming ? (
          <Card className="space-y-3 border-danger">
            <p className="font-semibold">{t.deleteQuestion}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                icon={Trash2}
                disabled={busy}
                onClick={() => void deleteAll()}
              >
                {t.deleteConfirm}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setConfirming(false);
                }}
              >
                {t.deleteCancel}
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="ghost"
            icon={Trash2}
            fullWidth
            className="text-danger hover:bg-today-bg"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t.deleteAll}
          </Button>
        )}
        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>
      </section>

      <section aria-labelledby="privacy-title" className="space-y-3">
        <h2
          id="privacy-title"
          className="flex items-center gap-2 font-display text-xl font-semibold"
        >
          <ShieldCheck size={22} aria-hidden="true" className="text-basil-700" />
          {t.privacy}
        </h2>
        <ul className="list-disc space-y-1.5 pl-5">
          {t.privacyPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
