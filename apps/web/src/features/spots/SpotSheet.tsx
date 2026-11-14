import type { InventoryItemView } from '@fridgeai/core';
import { Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { ZoomablePhoto } from '../../ui/PhotoViewer';
import { shelfSuggestions } from './fridge-shelves';
import { PhotoPicker } from './PhotoPicker';
import { SpotThumb } from './SpotThumb';
import { useSpots } from './use-spots';

const t = messages.spots;

/**
 * The sheet behind «Platz» on an item page (ADR-0056): the spots of the item's current location,
 * «Kein Platz» and «Neuer Platz» (name, optional photo). The spot belongs to the product, so every
 * pack of it shows the spot afterwards. `onDone` gets the line to announce, or null for «Abbrechen».
 */
export function SpotSheet({
  item,
  onDone,
}: {
  item: InventoryItemView;
  onDone: (message: string | null) => void;
}) {
  const { householdId, ids, inventory } = useAppData();
  const spots = useSpots();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDone(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone]);

  const here = (spots ?? []).filter((spot) => spot.location === item.location);
  const currentPhoto = (spots ?? []).find((spot) => spot.id === item.spot?.id)?.photo;
  // In the fridge: the usual compartments as one-tap spots, the one that suits this food first.
  const shelves =
    item.location === 'fridge' && spots !== undefined
      ? shelfSuggestions(
          item.categoryId,
          t.shelves,
          here.map((spot) => spot.name),
        )
      : [];

  async function run(action: () => Promise<string>) {
    if (busy) {
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      onDone(await action());
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  const choose = (spotId: string, spotName: string) =>
    run(async () => {
      await inventory['products.setSpot']({
        commandId: ids.next(),
        householdId,
        productId: item.productId,
        spotId,
      });
      return t.saved(item.name, spotName);
    });

  const clear = () =>
    run(async () => {
      await inventory['products.setSpot']({
        commandId: ids.next(),
        householdId,
        productId: item.productId,
        spotId: null,
      });
      return t.cleared(item.name);
    });

  const create = (spotName = name.trim(), withPhoto = photo) =>
    run(async () => {
      const { spotId } = await inventory['spots.create']({
        commandId: ids.next(),
        householdId,
        name: spotName,
        location: item.location,
        ...(withPhoto === null ? {} : { photo: withPhoto }),
      });
      await inventory['products.setSpot']({
        commandId: ids.next(),
        householdId,
        productId: item.productId,
        spotId,
      });
      return t.saved(item.name, spotName);
    });

  // On the body, so the tab bar does not cover the bottom of the sheet.
  return createPortal(
    <div className="sheet-backdrop">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spot-sheet-title"
        className="sheet-panel max-h-[90dvh] space-y-4 overflow-y-auto"
      >
        <div>
          <h2 id="spot-sheet-title" className="font-display text-xl font-semibold">
            {t.sheetTitle}
          </h2>
          <p className="text-sm text-ink-muted">
            {t.sheetFor(item.name, messages.locations[item.location])}
          </p>
        </div>

        {/* The current spot's photo, large and in the middle: a tap shows it full screen (ADR-0082). */}
        {!creating && currentPhoto !== undefined && item.spot !== null ? (
          <ZoomablePhoto
            src={currentPhoto}
            title={item.spot.name}
            className="mx-auto aspect-[4/3] max-h-[40dvh]"
          />
        ) : null}

        {creating ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim() !== '') {
                void create();
              }
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="spot-name" className="block text-sm font-semibold">
                {t.nameLabel}
              </label>
              <input
                id="spot-name"
                value={name}
                maxLength={40}
                autoFocus
                autoComplete="off"
                placeholder={t.namePlaceholder}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                className="min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-lg outline-none focus:border-basil-600"
              />
            </div>
            {photo === null ? (
              <PhotoPicker label={t.takePhoto} onPhoto={setPhoto} disabled={busy} />
            ) : (
              <div className="space-y-2">
                <img
                  src={photo}
                  alt={t.photoPreview}
                  className="max-h-60 w-full rounded-xl border border-line object-cover"
                />
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setPhoto(null);
                  }}
                >
                  {t.photoRemove}
                </Button>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="submit" fullWidth disabled={busy || name.trim() === ''}>
                {t.save}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setCreating(false);
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            <ul className="space-y-1">
              {here.map((spot) => {
                const current = item.spot?.id === spot.id;
                return (
                  <li key={spot.id}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-current={current ? 'true' : undefined}
                      onClick={() => {
                        void choose(spot.id, spot.name);
                      }}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-surface-muted disabled:opacity-50"
                    >
                      <SpotThumb photo={spot.photo} />
                      <span className="min-w-0 flex-1 truncate font-semibold">{spot.name}</span>
                      {current ? (
                        <>
                          <Check size={20} aria-hidden="true" className="text-basil-700" />
                          <span className="sr-only">{t.current}</span>
                        </>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {shelves.length === 0 ? null : (
              <section aria-labelledby="shelves-title" className="space-y-2 pt-1">
                <h3 id="shelves-title" className="text-sm font-semibold text-ink-muted">
                  {t.shelvesTitle}
                </h3>
                <ul className="flex flex-wrap gap-2">
                  {shelves.map(({ shelf, name: shelfName, suits }) => (
                    <li key={shelf}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          void create(shelfName, null);
                        }}
                        className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${
                          suits
                            ? 'bg-basil-700 text-white hover:bg-basil-800'
                            : 'bg-surface-muted text-ink hover:bg-line'
                        }`}
                      >
                        {/* One inline run of text: a flex item would drop the space before «·». */}
                        <span>
                          {shelfName}
                          {suits ? <span className="font-normal">{` · ${t.suits}`}</span> : null}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <Button
              variant="secondary"
              icon={Plus}
              fullWidth
              disabled={busy}
              onClick={() => {
                setCreating(true);
              }}
            >
              {t.newSpot}
            </Button>
            {item.spot === null ? null : (
              <Button
                variant="ghost"
                fullWidth
                disabled={busy}
                onClick={() => {
                  void clear();
                }}
              >
                {t.noSpot}
              </Button>
            )}
            <Button
              variant="ghost"
              fullWidth
              onClick={() => {
                onDone(null);
              }}
            >
              {t.cancel}
            </Button>
          </div>
        )}
        <p role="alert" className="text-sm text-today empty:hidden">
          {failed ? t.failed : null}
        </p>
      </div>
    </div>,
    document.body,
  );
}
