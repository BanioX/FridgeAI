import { IdSchema, type Id } from '@fridgeai/core';

/** What the recipe page hands to «Verarbeiten» when the person says «Gekocht» (ADR-0051). */
export interface ProcessPrefill {
  recipeId: string;
  title: string;
  /** Items at home that match the recipe's «Da» ingredients. */
  itemIds: Id[];
}

/** Router state survives reloads in the browser history: read it defensively. */
export function processPrefillFrom(state: unknown): ProcessPrefill | null {
  if (typeof state !== 'object' || state === null || !('process' in state)) {
    return null;
  }
  const fields = state.process as Record<string, unknown> | null;
  if (typeof fields !== 'object' || fields === null) {
    return null;
  }
  const { recipeId, title, itemIds } = fields;
  if (typeof recipeId !== 'string' || recipeId === '' || typeof title !== 'string') {
    return null;
  }
  return {
    recipeId: recipeId.slice(0, 80),
    title: title.slice(0, 120),
    itemIds: Array.isArray(itemIds)
      ? itemIds.flatMap((value) => {
          const id = IdSchema.safeParse(value);
          return id.success ? [id.data] : [];
        })
      : [],
  };
}

export type ResultChoice = 'made' | 'leftover' | 'none';

/** What goes into the name field and the result when the choice changes. */
export function resultFor(
  choice: ResultChoice,
  name: string,
): { name: string; kind: 'made' | 'leftover' } | undefined {
  const trimmed = name.trim();
  return choice === 'none' ? undefined : { name: trimmed, kind: choice };
}

/** Whether the form can be saved, and what is missing otherwise. */
export function problemWith(
  choice: ResultChoice,
  name: string,
  ingredientCount: number,
): 'name' | 'ingredients' | null {
  if (choice !== 'none' && name.trim() === '') {
    return 'name';
  }
  // Leftovers may come from nothing («Reste erfassen»); everything else needs ingredients.
  if (choice !== 'leftover' && ingredientCount === 0) {
    return 'ingredients';
  }
  return null;
}
