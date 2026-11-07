import {
  CATEGORIES,
  categoryById,
  DateKindSchema,
  fallbackCategory,
  shelfLifeAt,
  type DateKind,
  type InventoryItemView,
  type LocalDate,
  type StorageLocation,
  rappen,
} from '@fridgeai/core';
import { ArrowLeft } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { useAppData } from '../../app/AppData';
import { useMoney } from '../../app/money';
import { messages } from '../../app/messages.de-CH';
import { Button } from '../../ui/Button';
import { ChoiceChips } from '../../ui/ChoiceChips';
import { DateField } from '../../ui/DateField';
import { formatAmount, parseAmount } from './add-item';
import { cameFromDetail } from './edit-state';
import { locationOrder } from './item-meta';
import { useInventoryItem } from './use-item';

const t = messages.editItem;
const kindOptions = DateKindSchema.options.map((value) => ({ value, label: t.dateKinds[value] }));
const locationOptions = locationOrder.map((value) => ({ value, label: messages.locations[value] }));
const sortedCategories = [...CATEGORIES].sort((a, b) => a.name.de.localeCompare(b.name.de, 'de'));
const fieldClass = (invalid: boolean) =>
  `min-h-12 w-full rounded-xl border bg-surface px-4 text-lg tabular-nums outline-none focus:border-basil-600 ${
    invalid ? 'border-today' : 'border-line'
  }`;

/** «… bearbeiten»: correct what was entered wrong – date, date kind, quantity, value. */
export function EditItemPage() {
  const { itemId } = useParams();
  const item = useInventoryItem(itemId);

  if (item === undefined) {
    return <p className="sr-only">{messages.loading}</p>;
  }
  if (item === null) {
    return (
      <div className="space-y-4">
        <Link to="/inventory" className="inline-flex min-h-12 items-center gap-2 font-semibold">
          <ArrowLeft size={20} aria-hidden="true" />
          {messages.itemDetail.back}
        </Link>
        <p>{messages.itemDetail.gone}</p>
      </div>
    );
  }
  // Keyed by id so the form starts from the item's values once they are loaded.
  return <EditItemForm key={item.id} item={item} />;
}

function EditItemForm({ item }: { item: InventoryItemView }) {
  const { householdId, ids, inventory, today } = useAppData();
  const money = useMoney();
  const navigate = useNavigate();
  const location = useLocation();
  const id = useId();
  const [name, setName] = useState(item.name);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [place, setPlace] = useState<StorageLocation>(item.location);
  const [expiresOn, setExpiresOn] = useState<LocalDate | null>(item.expiresOn);
  const [kind, setKind] = useState<DateKind>(item.expiryKind);
  // Compared as text: ⅓ shows as «0.333», and saving it untouched must not change the quantity.
  const initialQuantity = formatAmount(item.quantity);
  const initialPrice =
    item.priceRappen === undefined ? '' : money.format(item.priceRappen, { currency: false });
  const [quantityText, setQuantityText] = useState(initialQuantity);
  const [priceText, setPriceText] = useState(initialPrice);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const category = categoryById(categoryId) ?? fallbackCategory();
  const quantity = parseAmount(quantityText);
  const price = priceText.trim() === '' ? null : money.parse(priceText);
  const priceInvalid = priceText.trim() !== '' && (price === null || price < 0);
  const errors = {
    name: name.trim() === '' ? t.nameMissing : null,
    date: expiresOn === null ? t.dateMissing : null,
    quantity: quantity === null ? t.quantityInvalid : null,
    price: priceInvalid ? t.priceInvalid(money.format(rappen(395), { currency: false })) : null,
  };
  const shown = (error: string | null) => (submitted ? error : null);
  const detailPath = `/inventory/${item.id}`;

  async function save() {
    setSubmitted(true);
    if (saving || errors.name !== null || expiresOn === null || quantity === null || priceInvalid) {
      return;
    }
    // Only what was touched: the handler also skips equal values, but rounding must not leak in.
    const changes = {
      ...(name.trim() === item.name ? {} : { name: name.trim() }),
      ...(categoryId === item.categoryId ? {} : { categoryId }),
      ...(place === item.location ? {} : { location: place }),
      ...(expiresOn === item.expiresOn ? {} : { expiresOn }),
      ...(kind === item.expiryKind ? {} : { expiryKind: kind }),
      ...(quantityText.trim() === initialQuantity ? {} : { quantity }),
      ...(priceText.trim() === initialPrice ? {} : { priceRappen: price }),
    };
    if (Object.keys(changes).length === 0) {
      setStatus(t.unchanged);
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const result = await inventory['inventory.updateItem']({
        commandId: ids.next(),
        householdId,
        itemId: item.id,
        ...changes,
      });
      if (result.changed.length === 0) {
        setStatus(t.unchanged);
        return;
      }
      // Back to the detail page the form was opened from, so «back» there leads to the list.
      // Opened directly (bookmark, reload): replace the form with the detail page instead.
      if (cameFromDetail(location.state)) {
        void navigate(-1);
      } else {
        void navigate(detailPath, { replace: true });
      }
    } catch {
      setStatus(t.failed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <Link
        to={detailPath}
        className="inline-flex min-h-12 items-center gap-2 font-semibold text-basil-700"
      >
        <ArrowLeft size={20} aria-hidden="true" />
        {t.back}
      </Link>
      <h1 className="large-title">{t.title(item.name)}</h1>

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
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            maxLength={120}
            autoComplete="off"
            aria-invalid={shown(errors.name) !== null}
            aria-describedby={`${id}-name-error`}
            className={fieldClass(shown(errors.name) !== null)}
          />
          <p id={`${id}-name-error`} className="text-sm text-today">
            {shown(errors.name)}
          </p>
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
                setCategoryId(event.target.value);
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

        <ChoiceChips
          legend={t.location}
          segmented
          options={locationOptions}
          value={place}
          onChange={setPlace}
        />

        <div className="space-y-1.5">
          <DateField
            label={t.expiry}
            value={expiresOn}
            onChange={setExpiresOn}
            today={today}
            location={place}
            typicalShelfLifeDays={shelfLifeAt(category, place)}
            estimated={item.expirySource === 'category_estimate' && expiresOn === item.expiresOn}
          />
          <p className="text-sm text-today">{shown(errors.date)}</p>
        </div>

        <ChoiceChips
          legend={t.dateKind}
          segmented
          options={kindOptions}
          value={kind}
          onChange={setKind}
        />

        <div className="space-y-1.5">
          <label htmlFor={`${id}-quantity`} className="font-semibold">
            {t.quantity(messages.units[item.unit])}
          </label>
          <input
            id={`${id}-quantity`}
            value={quantityText}
            onChange={(event) => {
              setQuantityText(event.target.value);
            }}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={shown(errors.quantity) !== null}
            aria-describedby={`${id}-quantity-error`}
            className={fieldClass(shown(errors.quantity) !== null)}
          />
          <p id={`${id}-quantity-error`} className="text-sm text-today">
            {shown(errors.quantity)}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-price`} className="font-semibold">
            {t.price(money.symbol)}
          </label>
          <p id={`${id}-price-hint`} className="text-sm text-ink-muted">
            {t.priceHint}
          </p>
          <input
            id={`${id}-price`}
            value={priceText}
            onChange={(event) => {
              setPriceText(event.target.value);
            }}
            inputMode="decimal"
            autoComplete="off"
            aria-invalid={shown(errors.price) !== null}
            aria-describedby={`${id}-price-hint ${id}-price-error`}
            className={fieldClass(shown(errors.price) !== null)}
          />
          <p id={`${id}-price-error`} className="text-sm text-today">
            {shown(errors.price)}
          </p>
        </div>

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
