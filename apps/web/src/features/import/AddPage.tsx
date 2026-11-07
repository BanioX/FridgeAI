import { PencilLine, Receipt, ScanBarcode, Sparkles } from 'lucide-react';
import { messages } from '../../app/messages.de-CH';
import { MenuList } from '../../ui/MenuList';
import { QuickAdd } from '../inventory/QuickAdd';

const t = messages.addHub;

/**
 * «Erfassen» behind the ＋ tab (ADR-0031): every way into the inventory as one short menu, the
 * household's usual products below as one-tap chips («Schnell erfassen»).
 */
export function AddPage() {
  return (
    <div className="space-y-6 pb-8">
      <h1 className="large-title">{messages.pages.add}</h1>
      <MenuList
        entries={[
          { to: '/add/receipt', icon: Receipt, title: messages.pages.receipt, detail: t.receipt },
          {
            to: '/inventory/new?scan=1',
            icon: ScanBarcode,
            title: messages.scanner.open,
            detail: t.barcode,
          },
          { to: '/inventory/new', icon: PencilLine, title: t.manualTitle, detail: t.manual },
          { to: '/add/ai', icon: Sparkles, title: messages.pages.ai, detail: t.ai },
        ]}
      />
      <QuickAdd />
    </div>
  );
}
