import { FileText } from 'lucide-react';
import { useId, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { openReport } from './current-report';
import { PeriodPicker } from './PeriodPicker';
import { chosenPeriod, initialPeriod, monthOptions } from './report-period';
import { REPORT_KINDS, usesPeriod, type ReportKind } from './receipt-spec';

const t = messages.reports;

const kindOptions = REPORT_KINDS.map((value) => ({ value, label: t.kinds[value].label }));
type DaysChoice = keyof typeof t.days;
const DAYS: Record<Exclude<DaysChoice, 'custom'>, number> = { one: 1, three: 3, seven: 7 };
const daysOptions = (Object.keys(t.days) as DaysChoice[]).map((value) => ({
  value,
  label: t.days[value],
}));

/** The typed number of days, kept between 1 and 60; 3 while the field is empty. */
const customDays = (text: string) => {
  const value = Number.parseInt(text, 10);
  return Number.isNaN(value) ? 3 : Math.min(60, Math.max(1, value));
};

/**
 * «Berichte als PDF» (ADR-0030): choose what the report is about. The short reports come as a
 * receipt, «Ausführlich» as the full report. Rettich builds the PDF on the device and opens it
 * inside the app; sharing is a tap away there.
 */
export function ReportCard() {
  const { householdId, inventory, today } = useAppData();
  const money = useMoney();
  const navigate = useNavigate();
  const daysId = useId();
  const [kind, setKind] = useState<ReportKind>('impact');
  const [periodState, setPeriodState] = useState(() => initialPeriod(today));
  const [daysChoice, setDaysChoice] = useState<DaysChoice>('three');
  const [daysText, setDaysText] = useState('14');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const days = daysChoice === 'custom' ? customDays(daysText) : DAYS[daysChoice];
  // Receipts about today use the running month only for what they do not show.
  const chosen = usesPeriod(kind) ? chosenPeriod(periodState, today) : monthOptions(today, 1)[0];
  const detail = usesPeriod(kind)
    ? (chosen?.label ?? '')
    : kind === 'expiring'
      ? t.nextDays(days)
      : t.now;

  async function create() {
    if (chosen === undefined || chosen === null) {
      return;
    }
    setBusy(true);
    setStatus(t.creating);
    try {
      const report = await inventory['reports.build']({
        householdId,
        from: chosen.period.from,
        to: chosen.period.to,
      });
      const { loadPdfPictures } = await import('./pdf-assets');
      const pictures = await loadPdfPictures();
      const options = { household: messages.defaults.householdName, createdOn: today, pictures };
      let blob: Blob;
      if (kind === 'full') {
        const { reportPdf } = await import('./report-pdf');
        blob = await reportPdf(report, { ...options, period: detail, money });
      } else {
        const [{ receiptPdf }, { receiptSpec }] = await Promise.all([
          import('./receipt-pdf'),
          import('./receipt-spec'),
        ]);
        blob = await receiptPdf(receiptSpec(report, kind, { money, days }), { ...options, detail });
      }
      const name = kind === 'full' ? 'rettich-bericht' : `rettich-quittung-${kind}`;
      openReport({
        file: new File([blob], `${name}-${today}.pdf`, { type: 'application/pdf' }),
        title: t.reportTitle(t.kinds[kind].label, detail),
      });
      void navigate('/more/reports/view');
    } catch {
      setStatus(t.failed);
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-5">
      <p className="text-ink-muted">{t.intro}</p>
      <div className="space-y-2">
        <ChoiceChips legend={t.kindLegend} options={kindOptions} value={kind} onChange={setKind} />
        <p className="text-sm text-ink-muted">{t.kinds[kind].hint}</p>
      </div>
      {usesPeriod(kind) ? (
        <PeriodPicker state={periodState} onChange={setPeriodState} today={today} />
      ) : null}
      {kind === 'expiring' ? (
        <div className="space-y-3">
          <ChoiceChips
            legend={t.daysLegend}
            options={daysOptions}
            value={daysChoice}
            onChange={setDaysChoice}
            segmented
          />
          {daysChoice === 'custom' ? (
            <div className="space-y-2">
              <label htmlFor={daysId} className="font-semibold">
                {t.customDays}
              </label>
              <input
                id={daysId}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={2}
                value={daysText}
                onChange={(event) => {
                  setDaysText(event.target.value.replace(/\D/g, ''));
                }}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-lg tabular-nums outline-none focus:border-basil-600"
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <Button
        icon={FileText}
        fullWidth
        disabled={busy || chosen === null || chosen === undefined}
        onClick={() => void create()}
      >
        {busy ? t.creating : t.create}
      </Button>
      <p role="status" className="text-sm font-semibold text-basil-800">
        {status}
      </p>
    </Card>
  );
}
