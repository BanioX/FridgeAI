import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { periodStart, type Period } from './period';
import type { ReportKind } from './report-pdf';

const t = messages.reports;

const kindOptions = (Object.keys(t.kinds) as ReportKind[]).map((value) => ({
  value,
  label: t.kinds[value],
}));
const periodOptions = (Object.keys(t.periods) as Period[]).map((value) => ({
  value,
  label: t.periods[value],
}));

/** Shares the PDF where the device can (iPhone: Files, Mail, WhatsApp), else downloads it. */
async function hand(file: File) {
  // Not every browser has canShare (desktop Firefox), even though the types say so.
  if ('canShare' in navigator && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * «Berichte als PDF» (ADR-0030): choose a report and a period, Rettich builds the PDF on the
 * device and hands it to the share sheet or the downloads.
 */
export function ReportCard() {
  const { householdId, inventory, today } = useAppData();
  const [kind, setKind] = useState<ReportKind>('all');
  const [period, setPeriod] = useState<Period>('month');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function create() {
    setBusy(true);
    setStatus(t.creating);
    try {
      const report = await inventory['reports.build']({
        householdId,
        from: periodStart(period, today),
        to: today,
      });
      const { reportPdf } = await import('./report-pdf');
      const blob = await reportPdf(report, {
        kind,
        household: messages.defaults.householdName,
        period: t.periods[period],
        createdOn: today,
      });
      await hand(new File([blob], `Rettich-${kind}-${today}.pdf`, { type: 'application/pdf' }));
      setStatus(t.created);
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <p className="text-ink-muted">{t.intro}</p>
      <ChoiceChips legend={t.kindLegend} options={kindOptions} value={kind} onChange={setKind} />
      <ChoiceChips
        legend={t.periodLegend}
        options={periodOptions}
        value={period}
        onChange={setPeriod}
        segmented
      />
      <Button icon={FileText} fullWidth disabled={busy} onClick={() => void create()}>
        {busy ? t.creating : t.create}
      </Button>
      <p role="status" className="text-sm font-semibold text-basil-800">
        {status}
      </p>
    </Card>
  );
}
