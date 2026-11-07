import { CONTRACT_VERSION } from '@fridgeai/core';
import {
  FileChartColumn,
  HistoryIcon,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
} from 'lucide-react';
import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { MenuList } from '../../ui/MenuList';

const t = messages.more;

/** Already started from the home screen (iPhone: navigator.standalone, others: display mode). */
function isInstalled(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return (
    iosStandalone ||
    // Typed as always there, but missing in older WebViews and in test DOMs.
    (typeof (window.matchMedia as unknown) === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches)
  );
}

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

/**
 * «Mehr» (ADR-0031): everything that is not the daily fridge – reports, Nachkaufen, the person's
 * data and privacy, the install hint – as one menu, so the tab bar keeps four clear places.
 */
export function MorePage() {
  return (
    <div className="space-y-6">
      <h1 className="large-title">{messages.pages.more}</h1>

      {isInstalled() ? null : (
        <Card variant="tip">
          <h2 className="flex items-center gap-2 font-semibold">
            <Smartphone size={20} aria-hidden="true" />
            {t.install}
          </h2>
          <p className="mt-1">{isIos() ? t.installIos : t.installOther}</p>
        </Card>
      )}

      <MenuList
        entries={[
          {
            to: '/more/reports',
            icon: FileChartColumn,
            title: messages.reports.title,
            detail: t.reportsDetail,
          },
          {
            to: '/more/history',
            icon: HistoryIcon,
            title: messages.pages.history,
            detail: t.historyDetail,
          },
          {
            to: '/shopping',
            icon: ShoppingBasket,
            title: messages.pages.shopping,
            detail: t.shoppingDetail,
          },
          { to: '/more/data', icon: ShieldCheck, title: messages.pages.data, detail: t.dataDetail },
        ]}
      />

      <p className="text-sm text-ink-muted">
        {messages.contractVersion} {CONTRACT_VERSION}
      </p>
    </div>
  );
}
