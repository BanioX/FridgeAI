import {
  CATEGORIES,
  categoryById,
  ContainerSchema,
  expiryFromScan,
  fallbackCategory,
  formatSwissDate,
  matchCategoryByName,
  parseChf,
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
  type StorageLocation,
} from '@fridgeai/core';
import { useId, useRef, useState } from 'react';
import { ScanBarcode } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { DateField } from '../../ui/DateField';
import { BarcodeScanner } from '../scan/BarcodeScanner';
import {
  formatAmount,
  INPUT_UNITS,
  parseAmount,
  parsePackSize,
  suggestedAmount,
  suggestedExpiry,
} from './add-item';
import { locationOrder } from './item-meta';
import { NameSearch, type FoundProduct } from './NameSearch';
import { QuickAdd } from './QuickAdd';

const t = messages.addItem;
const sortedCategories = [...CATEGORIES].sort((a, b) => a.name.de.localeCompare(b.name.de, 'de'));
const fieldClass = (invalid: boolean, width = 'w-full') =>
  `min-h-12 ${width} rounded-xl border bg-surface px-4 text-lg outline-none focus:border-basil-600 ${
    invalid ? 'border-today' : 'border-line'
  }`;

/**
 * «Artikel erfassen» (step 3d): the name suggests the category, which suggests location, unit,
 * amount and expiry date. Everything stays editable; nothing needs more than the name.
 */
export function AddItemPage() {
  const { householdId, ids, inventory, today } = useAppData();
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
  const [priceText, setPriceText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [round, setRound] = useState(0);
  const [scanOpen, setScanOpen] = useState(params.get('scan') === '1');
  const [scanned, setScanned] = useState<{
    gtin?: Gtin;
    date?: { expiresOn: LocalDate; kind: DateKind };
  } | null>(null);
  const [scanStatus, setScanStatus] = useState('');
  const [fromOpenFoodFacts, setFromOpenFoodFacts] = useState(false);
  // The name taken from the search: no suggestions for it until the person types again.
  const [pickedName, setPickedName] = useState<string | null>(null);

  const category =
    (categoryChoice === null ? undefined : categoryById(categoryChoice)) ??
    matchCategoryByName(name) ??
    fallbackCategory();
  const portioning = portioningOf(category);
  const location = locationChoice ?? category.defaultLocation;
  const suggestion = suggestedAmount(category);
  const unit = unitChoice ?? suggestion.unit;
  const amountValue = amountText ?? formatAmount(suggestion.amount);
  const container = containerChoice ?? portioning.container ?? '';
  const expiresOn =
    dateChoice === null ? suggestedExpiry(category, location, today) : dateChoice.value;
  const amount = parseAmount(amountValue);
  const price = priceText.trim() === '' ? undefined : parseChf(priceText);

  const errors = {
    name: name.trim() === '' ? t.nameMissing : null,
    amount: amount === null ? t.amountInvalid : null,
    date: expiresOn === null ? t.dateMissing : null,
    price: price === null || (price !== undefined && price < 0) ? t.priceInvalid : null,
  };
  const shown = (error: string | null) => (submitted ? error : null);
  // The code's date counts as read from the pack only while the person keeps it.
  const dateFromCode =
    scanned?.date !== undefined && dateChoice?.value === scanned.date.expiresOn
      ? scanned.date
      : undefined;

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
  }

  /** A name-search hit fills the form; with a barcode it goes the same way as a scan (ADR-0024). */
  function pickFound(product: FoundProduct) {
    setPickedName(product.name);
    const picked = messages.nameSearch.picked(product.name);
    setName(product.name);
    setCategoryChoice(product.categoryId);
    setFromOpenFoodFacts(false);
    if (product.gtin === undefined) {
      setScanStatus(picked);
      return;
    }
    setScanned({ gtin: product.gtin });
    setScanStatus(`${picked} ${messages.scanner.looking}`);
    void lookUp(product.gtin, picked);
  }

  async function save(next: boolean) {
    setSubmitted(true);
    setStatus('');
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
        ...(scanned?.gtin === undefined ? {} : { gtin: scanned.gtin }),
        ...(price === undefined ? {} : { priceRappen: price }),
      });
      if (!next) {
        void navigate(`/inventory?location=${location}`);
        return;
      }
      setStatus(t.saved(name.trim()));
      setName('');
      setCategoryChoice(null);
      setAmountText(null);
      setUnitChoice(null);
      setContainerChoice(null);
      setDateChoice(null);
      setScanned(null);
      setScanStatus('');
      setFromOpenFoodFacts(false);
      setPriceText('');
      setSubmitted(false);
      setRound((value) => value + 1);
      nameInput.current?.focus();
    } catch {
      setStatus(t.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <h1 className="large-title">{messages.pages.addItem}</h1>

      <div className="space-y-3">
        <Button
          variant="secondary"
          icon={ScanBarcode}
          fullWidth
          aria-expanded={scanOpen}
          onClick={() => {
            setScanOpen(!scanOpen);
          }}
        >
          {messages.scanner.open}
        </Button>
        {scanOpen ? (
          <Card>
            <BarcodeScanner onCode={onCode} />
          </Card>
        ) : null}
        <p aria-live="polite" className="font-semibold text-basil-800">
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

      <QuickAdd />

      <form
        noValidate
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void save(false);
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

        <div className="space-y-1.5">
          <label htmlFor={`${id}-category`} className="font-semibold">
            {t.category}
          </label>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl">
              {category.emoji}
            </span>
            <select
              id={`${id}-category`}
              value={category.id}
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
          </div>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="font-semibold">{t.location}</legend>
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-surface-muted p-1">
            {locationOrder.map((option) => (
              <label
                key={option}
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-1 text-center text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-basil-600 ${
                  option === location
                    ? 'bg-surface font-semibold text-basil-800 shadow-card'
                    : 'font-medium text-ink-muted'
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
          <DateField
            key={round}
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
          <p className="text-sm text-today">{shown(errors.date)}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-price`} className="font-semibold">
            {t.price}
          </label>
          <input
            id={`${id}-price`}
            value={priceText}
            onChange={(event) => {
              setPriceText(event.target.value);
            }}
            inputMode="decimal"
            autoComplete="off"
            placeholder={t.pricePlaceholder}
            aria-invalid={shown(errors.price) !== null}
            aria-describedby={`${id}-price-error`}
            className={`${fieldClass(shown(errors.price) !== null)} tabular-nums`}
          />
          <p id={`${id}-price-error`} className="text-sm text-today">
            {shown(errors.price)}
          </p>
        </div>

        <p role="status" className="font-semibold text-basil-800">
          {status}
        </p>

        <div className="space-y-2">
          <Button type="submit" fullWidth disabled={saving}>
            {t.save}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={saving}
            onClick={() => {
              void save(true);
            }}
          >
            {t.saveAndNext}
          </Button>
        </div>
      </form>
    </div>
  );
}
