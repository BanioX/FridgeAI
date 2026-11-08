import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { ReportCard } from './ReportCard';

/** «Auszüge» under «Mehr» (ADR-0030, ADR-0031). */
export function ReportsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/more" label={messages.pages.more} />
        <h1 className="large-title">{messages.reports.title}</h1>
      </div>
      <ReportCard />
    </div>
  );
}
