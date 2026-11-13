import { useLiveQuery } from 'dexie-react-hooks';
import { Camera, ListPlus, PencilLine, Receipt, ScanBarcode, Soup } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { CameraInput } from '../../ui/CameraInput';
import { Card } from '../../ui/Card';
import { MenuList } from '../../ui/MenuList';
import { QuickAdd } from '../inventory/QuickAdd';
import { handOverPhoto } from '../photo/photo-handover';

const t = messages.addHub;

/**
 * «Erfassen» behind the ＋ tab (ADR-0031). One way for every photo (ADR-0078): the green tile
 * opens the camera, and Rettich sees whether it is a receipt or a pack (ADR-0068). The other ways
 * follow as one grouped list, then the household's usual products as one-tap chips.
 */
export function AddPage() {
  const { householdId, inventory } = useAppData();
  const navigate = useNavigate();
  const empty = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items.length === 0,
    [householdId, inventory],
  );
  return (
    <div className="space-y-5 pb-8">
      <h1 className="large-title">{messages.pages.add}</h1>

      <CameraInput
        className="flex min-h-44 flex-col justify-between gap-4 rounded-2xl bg-basil-700 p-5 text-white shadow-float transition-colors hover:bg-basil-800"
        onPhotos={([file]) => {
          if (file !== undefined) {
            handOverPhoto(file);
            void navigate('/add/photo');
          }
        }}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-white/15">
          <Camera size={28} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-2xl font-semibold tracking-tight">{t.photoTitle}</span>
          <span className="block text-white/85">{t.photo}</span>
        </span>
      </CameraInput>

      <MenuList
        entries={[
          { to: '/add/receipt', icon: Receipt, title: t.uploadTitle, detail: t.upload },
          {
            to: '/inventory/new?scan=1',
            icon: ScanBarcode,
            title: messages.scanner.open,
            detail: t.barcode,
          },
          { to: '/inventory/new', icon: PencilLine, title: t.manualTitle, detail: t.manual },
          { to: '/add/batch', icon: ListPlus, title: t.batchTitle, detail: t.batch },
          {
            to: '/add/process?kind=leftover',
            icon: Soup,
            title: t.leftoversTitle,
            detail: t.leftovers,
          },
        ]}
      />

      {empty === true ? (
        <Card variant="tip" className="text-sm">
          <p className="font-semibold">{t.startTitle}</p>
          <p className="mt-1">{t.start}</p>
        </Card>
      ) : null}

      <QuickAdd />
    </div>
  );
}
