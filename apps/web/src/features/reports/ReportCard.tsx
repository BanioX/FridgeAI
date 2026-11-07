import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { openReport } from './current-report';
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

/**
 * «Berichte als PDF» (ADR-0030): choose a report and a period, rettich builds the PDF on the
 * device and opens it inside the app; sharing is a tap away there.
 */
export function ReportCard() {
  const { householdId, inventory, today } = useAppData();
  const navigate = useNavigate();
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
      openReport({
        file: new File([blob], `rettich-${kind}-${today}.pdf`, { type: 'application/pdf' }),
        title: `${t.kinds[kind]} · ${t.periods[period]}`,
      });
      void navigate('/more/reports/view');
    } catch {
      setStatus(t.failed);
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
