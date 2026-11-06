/** Router state the detail page sets on its «bearbeiten» link (own module: keeps pages lazy). */
export const FROM_DETAIL = { fromDetail: true } as const;

export const cameFromDetail = (state: unknown): boolean =>
  typeof state === 'object' && state !== null && 'fromDetail' in state && state.fromDetail === true;
