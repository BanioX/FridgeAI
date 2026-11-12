import { formatSwissDate, HouseholdExportSchema, type HouseholdExport } from '@fridgeai/core';
import { Download, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import {
  backupDayOfImport,
  clearLastBackup,
  readLastBackup,
  writeLastBackup,
} from './backup-state';
import { exportFileName, saveFile } from './export-files';

const t = messages.household;

/**
 * «Deine Daten» under «Mehr»: the person's data (export as JSON, bring an export back,
 * delete everything, ADR-0020) and privacy in plain words. Sharing with flatmates arrives with
 * accounts (step 7).
 */
export function HouseholdPage() {
  const { householdId, ids, household, today } = useAppData();
  const [status, setStatus] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ name: string; data: HouseholdExport } | null>(null);
  const [lastBackup, setLastBackup] = useState(readLastBackup);
  const fileInput = useRef<HTMLInputElement>(null);

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
      writeLastBackup(today);
      setLastBackup(today);
      return t.exported(name);
    });

  /** Reads the chosen file on the device; nothing is replaced before the person confirms. */
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) =>
    run(async () => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file === undefined) {
        return null;
      }
      let json: unknown;
      try {
        json = JSON.parse(await file.text());
      } catch {
        return t.importInvalid;
      }
      const parsed = HouseholdExportSchema.safeParse(json);
      if (!parsed.success) {
        return t.importInvalid;
      }
      setConfirming(false);
      setPending({ name: file.name, data: parsed.data });
      return null;
    });

  const importAll = (data: HouseholdExport) =>
    run(async () => {
      await household['household.import']({
        commandId: ids.next(),
        householdId,
        data,
        confirm: true,
      });
      // The restored data is as old as the file: Start must not say «Noch keine Sicherung».
      writeLastBackup(backupDayOfImport(data.exportedAt, today));
      // Start again as the imported household.
      window.location.assign('/');
      return null;
    });

  const deleteAll = () =>
    run(async () => {
      await household['household.delete']({ commandId: ids.next(), householdId, confirm: true });
      clearLastBackup();
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
        <p className="text-sm text-ink-muted">
          {lastBackup === null ? t.noBackup : t.lastBackup(formatSwissDate(lastBackup))}
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={t.importFile}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void chooseFile(event)}
        />
        {pending === null ? (
          <Button
            variant="secondary"
            icon={Upload}
            fullWidth
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            {t.importJson}
          </Button>
        ) : (
          <Card className="space-y-3">
            <p className="font-semibold">
              {t.importQuestion(pending.name, pending.data.items.length)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void importAll(pending.data)}>
                {t.importConfirm}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setPending(null);
                }}
              >
                {t.deleteCancel}
              </Button>
            </div>
          </Card>
        )}
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
