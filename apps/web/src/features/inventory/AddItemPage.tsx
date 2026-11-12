import {
  addDays,
  CATEGORIES,
  categoryById,
  ContainerSchema,
  expiryFromScan,
  fallbackCategory,
  formatSwissDate,
  matchCategoryByName,
  minLocalDate,
  parseScannedCode,
  portioningOf,
  shelfLifeAt,
  StorageLocationSchema,
  toBaseQuantity,
  type Container,
  type DateKind,
  type Gtin,
  type InputUnit,
  type LocalDate,
  type Owner,
  type StorageLocation,
  type WasteHabit,
  rappen,
} from '@fridgeai/core';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { BackLink } from '../../ui/BackLink';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { DateField } from '../../ui/DateField';
import { BarcodeScanner } from '../scan/BarcodeScanner';
import { DatePhotoButton } from './DatePhotoButton';
import {
  formatAmount,
  INPUT_UNITS,
  moreSummary,
  parseAmount,
  parsePackSize,
  suggestedAmount,
  suggestedExpiry,
} from './add-item';
import { locationOrder } from './item-meta';
import { NameSearch, type FoundProduct } from './NameSearch';
import { PriceMemoryNote } from '../receipts/PriceMemoryNote';
import { OwnerChoice } from '../people/OwnerChoice';
import { useMembers } from '../people/use-members';

const t = messages.addItem;
const boughtOptions = [
  { value: 'packed' as const, label: t.packed },
  { value: 'loose' as const, label: t.loose },
];
const sortedCategories = [...CATEGORIES].sort((a, b) => a.name.de.localeCompare(b.name.de, 'de'));
const fieldClass = (invalid: boolean, width = 'w-full') =>
  `min-h-12 ${width} rounded-xl border bg-surface px-4 text-lg outline-none focus:border-basil-600 ${
    invalid ? 'border-today' : 'border-line'
  }`;

/**
 * «Artikel erfassen» (step 3d): the name suggests the category, which suggests location, unit,
 * amount and expiry date. Everything stays editable; nothing needs more than the name. The
 * category itself stays out of sight under «Mehr Angaben» (ADR-0026).
 */
export function AddItemPage() {
  const { householdId, ids, inventory, today } = useAppData();
  const money = useMoney();
  const example = money.format(rappen(395), { currency: false });
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = useId();
  const fromTab = StorageLocationSchema.safeParse(params.get('location'));
  const nameInput = useRef<HTMLInputElement>(null);

  // `null` means «use the suggestion», so suggestions follow the name until the person decides.
  // «In den Vorrat legen» from the shopping list brings the name along.
  const [name, setName] = useState(() => params.get('name')?.trim().slice(0, 120) ?? '');
  const [categoryChoice, setCategoryChoice] = useState<string | null>(null);
  const [locationChoice, setLocationChoice] = useState<StorageLocation | null>(
    fromTab.success ? fromTab.data : null,
  );
  const [amountText, setAmountText] = useState<string | null>(null);
  const [unitChoice, setUnitChoice] = useState<InputUnit | null>(null);
  const [containerChoice, setContainerChoice] = useState<Container | '' | null>(null);
  const [dateChoice, setDateChoice] = useState<{ value: LocalDate | null } | null>(null);
  /** What the household often throws away (ADR-0038), for a hint while adding more of it. */
  const [habits, setHabits] = useState<readonly WasteHabit[]>([]);
  useEffect(() => {
    let active = true;
    inventory['products.wasteHabits']({ householdId })
      .then(({ habits: found }) => {
        if (active) {
          setHabits(found);
        }
      })
      .catch(() => {
        // Only a hint: without it the form works the same.
      });
    return () => {
      active = false;
    };
  }, [householdId, inventory]);
  /** Cheese, cold cuts or a dip from the counter keep only as long as an open pack. */
  const [bought, setBought] = useState<'packed' | 'loose'>('packed');
  const [priceText, setPriceText] = useState('');
  /** «Gehört» (ADR-0058): everyone's unless the person marks it; only asked with two or more people. */
  const [ownerChoice, setOwnerChoice] = useState<Owner>('shared');
  const members = useMembers();
  const askOwner = members !== undefined && members.length >= 2;
  const ownerName = askOwner
    ? members.find((member) => member.id === ownerChoice)?.displayName
    : undefined;
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(params.get('scan') === '1');
  const [scanned, setScanned] = useState<{
    gtin?: Gtin;
    date?: { expiresOn: LocalDate; kind: DateKind };
  } | null>(null);
  const [scanStatus, setScanStatus] = useState('');
  /** The date read from a photo of the pack (ADR-0062), and what was said about it. */
  const [photoDate, setPhotoDate] = useState<{ expiresOn: LocalDate; kind?: DateKind } | null>(
    null,
  );
  const [photoStatus, setPhotoStatus] = useState('');
  const [fromOpenFoodFacts, setFromOpenFoodFacts] = useState(false);
  /** Open Food Facts calls it ready to eat (NOVA 4, dessert, meal): saved as Fertigprodukt. */
  const [readyHint, setReadyHint] = useState(false);
  // The name taken from the search: no suggestions for it until the person types again.
  const [pickedName, setPickedName] = useState<string | null>(null);

  const knownCategory =
    (categoryChoice === null ? undefined : categoryById(categoryChoice)) ??
    matchCategoryByName(name);
  const category = knownCategory ?? fallbackCategory();
  const portioning = portioningOf(category);
  // «Kühlschrank zuerst»: an unknown food goes to the fridge, not to the fallback category's
  // pantry – the location sits under «Mehr Angaben» and would otherwise change unseen.
  const location = locationChoice ?? knownCategory?.defaultLocation ?? 'fridge';
  const suggestion = suggestedAmount(category);
  const unit = unitChoice ?? suggestion.unit;
  const amountValue = amountText ?? formatAmount(suggestion.amount);
  const container = containerChoice ?? portioning.container ?? '';
  const habit =
    knownCategory === null ? undefined : habits.find((entry) => entry.categoryId === category.id);
  const looseDays =
    category.soldLoose === true && location === 'fridge' ? category.afterOpeningDays : undefined;
  const loose = bought === 'loose' && looseDays !== undefined;
  const suggested = suggestedExpiry(category, location, today);
  const expiresOn =
    dateChoice === null
      ? loose
        ? minLocalDate(suggested, addDays(today, looseDays))
        : suggested
      : dateChoice.value;
  const amount = parseAmount(amountValue);
  const price = priceText.trim() === '' ? undefined : money.parse(priceText);

  // What is set under «Mehr Angaben», so nothing optional stays hidden silently.
  const summary = moreSummary([
    amount === null ? null : `${formatAmount(amount)} ${messages.inputUnits[unit]}`,
    messages.locations[location],
    unit === 'pcs' && containerChoice !== null && container !== ''
      ? messages.containers[container]
      : null,
    price === undefined || price === null || price < 0 ? null : money.format(price),
    categoryChoice === null ? null : category.name.de,
    ownerName === undefined ? null : t.ownerSummary(ownerName),
  ]);

  const errors = {
    name: name.trim() === '' ? t.nameMissing : null,
    amount: amount === null ? t.amountInvalid : null,
    date: expiresOn === null ? t.dateMissing : null,
    price: price === null || (price !== undefined && price < 0) ? t.priceInvalid(example) : null,
  };
  const shown = (error: string | null) => (submitted ? error : null);
  // The code's date counts as read from the pack only while the person keeps it.
  const dateFromCode =
    scanned?.date !== undefined && dateChoice?.value === scanned.date.expiresOn
      ? scanned.date
      : undefined;

  // Like the code's date: it counts as read from the label only while the person keeps it.
  const dateFromPhoto =
    photoDate !== null && dateChoice?.value === photoDate.expiresOn ? photoDate : undefined;

  function onCode(raw: string) {
    const code = parseScannedCode(raw, today);
    if (code === null) {
      setScanStatus(messages.scanner.unknownCode);
      return;
    }
    const date = expiryFromScan(code.data) ?? undefined;
    setScanned({
      ...(code.data.gtin === undefined ? {} : { gtin: code.data.gtin }),
      ...(date === undefined ? {} : { date }),
    });
    if (date !== undefined) {
      setDateChoice({ value: date.expiresOn });
    }
    const label = code.data.gtin ?? raw.slice(0, 40);
    const found =
      date === undefined
        ? messages.scanner.found(label)
        : messages.scanner.foundWithDate(label, formatSwissDate(date.expiresOn));
    setScanOpen(false);
    setFromOpenFoodFacts(false);
    setReadyHint(false);
    nameInput.current?.focus();
    if (code.data.gtin === undefined) {
      setScanStatus(found);
      return;
    }
    setScanStatus(`${found} ${messages.scanner.looking}`);
    void lookUp(code.data.gtin, found);
  }

  /** Fills in what the household or Open Food Facts knows about the barcode (ADR-0016). */
  async function lookUp(gtin: Gtin, found: string) {
    const { product } = await inventory['products.lookup']({ householdId, gtin }).catch(() => ({
      product: null,
    }));
    if (product === null) {
      setScanStatus(`${found} ${messages.scanner.unknownProduct}`);
      return;
    }
    setName((current) => (current.trim() === '' ? product.name : current));
    setCategoryChoice(product.categoryId);
    const pack = product.packSize === undefined ? null : parsePackSize(product.packSize);
    if (pack !== null) {
      setAmountText(formatAmount(pack.amount));
      setUnitChoice(pack.unit);
    }
    const details = [product.brand, product.packSize].filter(Boolean).join(', ');
    setScanStatus(
      `${found} ${messages.scanner.product(product.name, details === '' ? '' : ` (${details})`)}`,
    );
    setFromOpenFoodFacts(product.source === 'off' || product.factsFrom === 'off');
    setReadyHint(product.readyMade === true);
  }

  /** A name-search hit fills the form; with a barcode it goes the same way as a scan (ADR-0024). */
  function pickFound(product: FoundProduct) {
    setPickedName(product.name);
    const picked = messages.nameSearch.picked(product.name);
    setName(product.name);
    setCategoryChoice(product.categoryId);
    setFromOpenFoodFacts(false);
    setReadyHint(false);
    if (product.gtin === undefined) {
      setScanStatus(picked);
      return;
    }
    setScanned({ gtin: product.gtin });
    setScanStatus(`${picked} ${messages.scanner.looking}`);
    void lookUp(product.gtin, picked);
  }

  async function save() {
    setSubmitted(true);
    setStatus('');
    if (errors.price !== null || errors.amount !== null) {
      // Amount and price live under «Mehr Angaben»: open it so the error is visible.
      setMoreOpen(true);
    }
    if (saving || amount === null || expiresOn === null || price === null) {
      return;
    }
    if (Object.values(errors).some((error) => error !== null)) {
      return;
    }
    setSaving(true);
    try {
      const base = toBaseQuantity(amount, unit);
      await inventory['inventory.addItem']({
        commandId: ids.next(),
        householdId,
        name: name.trim(),
        categoryId: category.id,
        location,
        quantity: base.quantity,
        unit: base.unit,
        ...(base.unit === 'pcs' && container !== '' ? { container } : {}),
        // Without a chosen date the handler estimates the same date the form showed.
        ...(dateChoice === null ? {} : { expiresOn }),
        ...(dateFromCode === undefined
          ? {}
          : { expirySource: 'gs1_code', expiryKind: dateFromCode.kind }),
        ...(dateFromCode !== undefined || dateFromPhoto === undefined
          ? {}
          : {
              expirySource: 'label_ocr',
              ...(dateFromPhoto.kind === undefined ? {} : { expiryKind: dateFromPhoto.kind }),
            }),
        ...(scanned?.gtin === undefined ? {} : { gtin: scanned.gtin }),
        ...(price === undefined ? {} : { priceRappen: price }),
        // From the counter: open from the day it was bought, the opening rule sets the date.
        ...(loose ? { openedOn: today } : {}),
        ...(readyHint ? { readyMade: true } : {}),
        ...(askOwner && ownerChoice !== 'shared' ? { owner: ownerChoice } : {}),
      });
      void navigate(`/inventory?location=${location}`);
    } catch {
      setStatus(t.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <BackLink to="/add" label={messages.pages.add} />
        <h1 className="large-title">{messages.pages.addItem}</h1>
      </div>

      {/* The scanner opens from the Erfassen hub (?scan=1); there is no button here any more. */}
      <div className="contents">
        {scanOpen ? (
          <Card>
            <BarcodeScanner onCode={onCode} />
          </Card>
        ) : null}
        <p aria-live="polite" className="font-semibold text-basil-800 empty:hidden">
          {scanStatus}
        </p>
        {fromOpenFoodFacts ? (
          <p className="text-sm text-ink-muted">
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {messages.scanner.attribution}
            </a>
          </p>
        ) : null}
      </div>

      <form
        noValidate
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor={`${id}-name`} className="font-semibold">
            {t.name}
          </label>
          <input
            id={`${id}-name`}
            ref={nameInput}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            placeholder={t.namePlaceholder}
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="done"
            aria-invalid={shown(errors.name) !== null}
            aria-describedby={`${id}-name-error`}
            className={fieldClass(shown(errors.name) !== null)}
          />
          <p id={`${id}-name-error`} className="text-sm text-today">
            {shown(errors.name)}
          </p>
          {/* After a scan or a pick the product is known: no search button then. */}
          <NameSearch
            query={scanned === null && name !== pickedName ? name : ''}
            onPick={pickFound}
          />
        </div>

        {habit === undefined ? null : (
          <Card variant="tip" className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 shrink-0 text-basil-600" size={22} aria-hidden="true" />
            <p>
              <strong>{t.habit(habit.times, habit.names)}</strong>
              {habit.tip === undefined ? null : ` ${habit.tip}`}
            </p>
          </Card>
        )}

        {looseDays === undefined ? null : (
          <div className="space-y-2">
            <ChoiceChips
              legend={t.bought}
              options={boughtOptions}
              value={bought}
              onChange={setBought}
              segmented
            />
            {loose ? <p className="text-sm text-ink-muted">{t.looseHint(looseDays)}</p> : null}
          </div>
        )}

        <div className="space-y-1.5">
          <DateField
            label={t.expiry}
            value={expiresOn}
            onChange={(value) => {
              setDateChoice({ value });
            }}
            today={today}
            location={location}
            typicalShelfLifeDays={shelfLifeAt(category, location)}
            estimated={dateChoice === null}
          />
          <DatePhotoButton
            today={today}
            onRead={(found) => {
              setPhotoDate({
                expiresOn: found.date,
                ...(found.kind === undefined ? {} : { kind: found.kind }),
              });
              setDateChoice({ value: found.date });
            }}
            onStatus={setPhotoStatus}
          />
          <p aria-live="polite" className="text-sm font-semibold text-basil-800 empty:hidden">
            {photoStatus}
          </p>
          <p className="text-sm text-today">{shown(errors.date)}</p>
        </div>

        {/* The category only works in the background (ADR-0026); changing it is rarely needed. */}
        <details
          className="group"
          open={moreOpen}
          onToggle={(event) => {
            setMoreOpen(event.currentTarget.open);
          }}
        >
          <summary className="flex min-h-11 w-fit max-w-full cursor-pointer list-none items-center gap-2 font-semibold text-basil-800 focus-visible:outline-2 focus-visible:outline-offset-2">
            <span>{summary === '' ? t.more : t.moreWith(summary)}</span>
            <ChevronDown
              size={20}
              aria-hidden="true"
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="mt-2 space-y-6">
            <div className="space-y-1.5">
              <label htmlFor={`${id}-amount`} className="font-semibold">
                {t.amount}
              </label>
              <div className="flex gap-2">
                <input
                  id={`${id}-amount`}
                  value={amountValue}
                  onChange={(event) => {
                    setAmountText(event.target.value);
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={shown(errors.amount) !== null}
                  aria-describedby={`${id}-amount-error`}
                  className={`${fieldClass(shown(errors.amount) !== null, 'min-w-0 flex-1')} tabular-nums`}
                />
                <select
                  aria-label={t.unit}
                  value={unit}
                  onChange={(event) => {
                    const chosen = INPUT_UNITS.find((option) => option === event.target.value);
                    setUnitChoice(chosen ?? null);
                  }}
                  className={fieldClass(false, 'w-32 shrink-0')}
                >
                  {INPUT_UNITS.map((option) => (
                    <option key={option} value={option}>
                      {messages.inputUnits[option]}
                    </option>
                  ))}
                </select>
              </div>
              <p id={`${id}-amount-error`} className="text-sm text-today">
                {shown(errors.amount)}
              </p>
              {portioning.packs === undefined ? null : (
                <div role="group" aria-label={t.packsLabel} className="flex flex-wrap gap-2">
                  {portioning.packs.map((count) => {
                    const selected = unit === 'pcs' && amount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setAmountText(String(count));
                          setUnitChoice('pcs');
                        }}
                        className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${
                          selected
                            ? 'border-basil-700 bg-basil-700 text-white'
                            : 'border-line bg-surface text-ink hover:bg-surface-muted'
                        }`}
                      >
                        {t.pack(count)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <fieldset className="space-y-1.5">
              <legend className="font-semibold">{t.location}</legend>
              <div className="grid grid-cols-4 gap-1 rounded-2xl bg-surface-muted p-1">
                {locationOrder.map((option) => (
                  <label
                    key={option}
                    className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-1 text-center text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-basil-600 ${
                      option === location
                        ? 'bg-basil-700 font-semibold text-white shadow-card'
                        : 'font-medium text-ink hover:bg-surface'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-location`}
                      value={option}
                      checked={option === location}
                      onChange={() => {
                        setLocationChoice(option);
                      }}
                      className="sr-only"
                    />
                    {messages.locations[option]}
                  </label>
                ))}
              </div>
            </fieldset>

            {unit === 'pcs' ? (
              <div className="space-y-1.5">
                <label htmlFor={`${id}-container`} className="font-semibold">
                  {t.container}
                </label>
                <select
                  id={`${id}-container`}
                  value={container}
                  onChange={(event) => {
                    const parsed = ContainerSchema.safeParse(event.target.value);
                    setContainerChoice(parsed.success ? parsed.data : '');
                  }}
                  className={fieldClass(false)}
                >
                  <option value="">{t.noContainer}</option>
                  {ContainerSchema.options.map((option) => (
                    <option key={option} value={option}>
                      {messages.containers[option]}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor={`${id}-price`} className="font-semibold">
                {t.price(money.symbol)}
              </label>
              <input
                id={`${id}-price`}
                value={priceText}
                onChange={(event) => {
                  setPriceText(event.target.value);
                }}
                inputMode="decimal"
                autoComplete="off"
                placeholder={t.pricePlaceholder(example)}
                aria-invalid={shown(errors.price) !== null}
                aria-describedby={`${id}-price-error`}
                className={`${fieldClass(shown(errors.price) !== null)} tabular-nums`}
              />
              <p id={`${id}-price-error`} className="text-sm text-today">
                {shown(errors.price)}
              </p>
              <PriceMemoryNote name={name} />
            </div>

            {askOwner ? (
              <OwnerChoice members={members} value={ownerChoice} onChange={setOwnerChoice} />
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor={`${id}-category`} className="font-semibold">
                {t.category}
              </label>
              <select
                id={`${id}-category`}
                value={category.id}
                aria-describedby={`${id}-category-hint`}
                onChange={(event) => {
                  setCategoryChoice(event.target.value);
                }}
                className={fieldClass(false)}
              >
                {sortedCategories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name.de}
                  </option>
                ))}
              </select>
              <p id={`${id}-category-hint`} className="text-sm text-ink-muted">
                {t.categoryHint}
              </p>
            </div>
          </div>
        </details>

        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>

        <Button type="submit" fullWidth disabled={saving}>
          {t.save}
        </Button>
      </form>
    </div>
  );
}
