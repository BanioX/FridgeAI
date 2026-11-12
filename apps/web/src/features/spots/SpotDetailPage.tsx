import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, ImageOff, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { GROUPED_ROW_LINK, GroupedList, GroupedListItem } from '../../ui/GroupedList';
import { formatQuantity } from '../../ui/quantity-text';
import { PhotoPicker } from './PhotoPicker';
import { useSpots } from './use-spots';

const t = messages.spots;

/**
 * One spot (ADR-0056): the large photo, what lies there now, and the changes: replace or remove
 * the photo, rename, delete (the products only lose the spot).
 */
export function SpotDetailPage() {
  const { spotId } = useParams();
  const { householdId, ids, inventory } = useAppData();
  const navigate = useNavigate();
  const spots = useSpots();
  const items = useLiveQuery(
    async () => (await inventory['inventory.list']({ householdId })).items,
    [householdId],
  );
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (spots === undefined || items === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  const spot = spots.find((entry) => entry.id === spotId);
  const back = <BackLink to="/more/spots" label={t.back} />;
  if (spot === undefined) {
    return (
      <div className="space-y-4">
        {back}
        <p>{t.notFound}</p>
      </div>
    );
  }
  const here = items.filter((item) => item.spot?.id === spot.id);

  async function run(action: () => Promise<void>) {
    if (busy) {
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await action();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const update = (fields: { name?: string; photo?: string | null }) =>
    run(async () => {
      await inventory['spots.update']({
        commandId: ids.next(),
        householdId,
        spotId: spot.id,
        ...fields,
      });
    });

  const remove = () =>
    run(async () => {
      await inventory['spots.delete']({ commandId: ids.next(), householdId, spotId: spot.id });
      void navigate('/more/spots', { replace: true });
    });

  return (
    <div className="space-y-6 pb-8">
      {back}
      <h1 className="large-title break-words">{spot.name}</h1>

      {spot.photo === undefined ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-muted text-ink-muted">
          <ImageOff size={28} aria-hidden="true" />
          <p>{t.photoMissing}</p>
        </div>
      ) : (
        <img
          src={spot.photo}
          alt={spot.name}
          className="max-h-[60dvh] w-full rounded-2xl border border-line bg-surface-muted object-contain"
        />
      )}

      <section aria-labelledby="spot-now" className="space-y-2">
        <h2 id="spot-now" className="font-display text-xl font-semibold">
          {t.now}
        </h2>
        {here.length === 0 ? (
          <p className="text-ink-muted">{t.nothingHere}</p>
        ) : (
          <GroupedList>
            {here.map((item) => (
              <GroupedListItem key={item.id} inset="text">
                <Link
                  to={`/inventory/${item.id}`}
                  className={`${GROUPED_ROW_LINK} flex min-h-14 items-center gap-3 py-2 pr-3 pl-4`}
                >
                  <span aria-hidden="true" className="text-2xl leading-none">
                    {item.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{item.name}</span>
                    <span className="block text-sm text-ink-muted">
                      {formatQuantity(item.quantity, item.unit)}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-ink-muted/60"
                  />
                </Link>
              </GroupedListItem>
            ))}
          </GroupedList>
        )}
      </section>

      <section aria-label={messages.itemDetail.more} className="space-y-3">
        <PhotoPicker
          label={spot.photo === undefined ? t.photoAdd : t.photoReplace}
          disabled={busy}
          onPhoto={(photo) => {
            void update({ photo });
          }}
        />
        {spot.photo === undefined ? null : (
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={() => {
              void update({ photo: null });
            }}
          >
            {t.photoRemove}
          </Button>
        )}

        {renaming === null ? (
          <Button
            variant="secondary"
            icon={Pencil}
            fullWidth
            disabled={busy}
            onClick={() => {
              setRenaming(spot.name);
            }}
          >
            {t.rename}
          </Button>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const name = renaming.trim();
              if (name !== '') {
                void update({ name }).then(() => {
                  setRenaming(null);
                });
              }
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="spot-rename" className="block text-sm font-semibold">
                {t.nameLabel}
              </label>
              <input
                id="spot-rename"
                value={renaming}
                maxLength={40}
                autoFocus
                autoComplete="off"
                onChange={(event) => {
                  setRenaming(event.target.value);
                }}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-lg outline-none focus:border-basil-600"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="submit" fullWidth disabled={busy || renaming.trim() === ''}>
                {t.renameSave}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setRenaming(null);
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        )}

        {confirming ? (
          <Card variant="tip" className="space-y-3">
            <p role="alert">{t.removeQuestion(spot.name)}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="danger" fullWidth disabled={busy} onClick={() => void remove()}>
                {t.removeConfirm}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setConfirming(false);
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="ghost"
            icon={Trash2}
            fullWidth
            disabled={busy}
            className="text-danger hover:bg-today-bg"
            onClick={() => {
              setConfirming(true);
            }}
          >
            {t.remove}
          </Button>
        )}
        <p role="alert" className="text-sm text-today empty:hidden">
          {failed ? t.failed : null}
        </p>
      </section>
    </div>
  );
}
