import { ChevronLeft, Share } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { currentReport } from './current-report';
import { renderPdfPages } from './render-pdf';
import { shareFile } from './share-file';

const t = messages.reports.view;

/**
 * The report opens inside the app, like a document in a banking app: «‹ Berichte» (or the phone's
 * back gesture) returns, «Teilen» top right hands the PDF to the share sheet or the downloads.
 */
export function ReportViewPage() {
  const report = currentReport();
  const navigate = useNavigate();
  const pagesBox = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[] | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (report === null) {
      return;
    }
    let current = true;
    const width = pagesBox.current?.clientWidth ?? 360;
    renderPdfPages(report.file, width)
      .then((rendered) => {
        if (current) {
          setPages(rendered);
        }
      })
      .catch(() => {
        if (current) {
          setStatus(t.failed);
        }
      });
    return () => {
      current = false;
    };
  }, [report]);

  if (report === null) {
    return (
      <div className="space-y-4">
        <BackLink to="/more/reports" label={t.back} />
        <Card>
          <p>{t.gone}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            void navigate(-1);
          }}
          className="-ml-1.5 inline-flex min-h-11 items-center gap-0.5 font-semibold text-basil-700"
        >
          <ChevronLeft size={24} aria-hidden="true" />
          {t.back}
        </button>
        <Button
          variant="ghost"
          icon={Share}
          aria-label={t.share}
          onClick={() => {
            void shareFile(report.file);
          }}
        />
      </div>
      <h1 className="font-display text-2xl font-semibold">{report.title}</h1>
      <p role="status" className="text-sm text-ink-muted empty:hidden">
        {pages === null && status === '' ? t.rendering : status}
      </p>
      <div ref={pagesBox} className="space-y-4">
        {pages?.map((src, index) => (
          <figure key={src.slice(-32) + String(index)}>
            <img
              src={src}
              alt={t.page(index + 1, pages.length)}
              className="w-full rounded-lg bg-white shadow-card"
            />
            <figcaption className="mt-1.5 text-center text-sm text-ink-muted" aria-hidden="true">
              {t.page(index + 1, pages.length)}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
