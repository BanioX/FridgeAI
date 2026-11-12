import { CONTRACT_V1, type OperationOutput } from '@fridgeai/core';

/** What «Foto aufnehmen» hands to «Artikel erfassen» (ADR-0068): suggestions, nothing saved yet. */
export interface PhotoPrefill {
  label: OperationOutput<'products.fromLabel'>;
  /** A barcode on the photo: treated like a scanned code. */
  code?: string;
  /** No readable text at all, e.g. an apple without a label. */
  empty: boolean;
}

/** The prefill from the navigation state, checked: anything else is no prefill. */
export function photoPrefillFrom(state: unknown): PhotoPrefill | null {
  if (typeof state !== 'object' || state === null || !('photo' in state)) {
    return null;
  }
  const photo: unknown = state.photo;
  if (typeof photo !== 'object' || photo === null) {
    return null;
  }
  const label = CONTRACT_V1['products.fromLabel'].output.safeParse(
    'label' in photo ? photo.label : undefined,
  );
  if (!label.success) {
    return null;
  }
  const code = 'code' in photo && typeof photo.code === 'string' ? photo.code : undefined;
  return {
    label: label.data,
    ...(code === undefined ? {} : { code }),
    empty: 'empty' in photo && photo.empty === true,
  };
}
