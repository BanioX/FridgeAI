import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { ReceiptUpload } from './ReceiptUpload';

/** «Bon hochladen» under «Erfassen» (ADR-0028, ADR-0031). */
export function ReceiptPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/add" label={messages.pages.add} />
        <h1 className="large-title">{messages.pages.receipt}</h1>
      </div>
      <ReceiptUpload />
    </div>
  );
}
