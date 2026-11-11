import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { AppDataProvider } from '../../app/AppData';
import { messages } from '../../app/messages.de-CH';
import { testDb } from '../../data/test-helpers';
import { RecipeFormPage } from './RecipeFormPage';
import { RecipeListPage } from './RecipeListPage';
import { RecipePage } from './RecipePage';

const t = messages.recipes;

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>;
}

function renderApp(path: string, db = testDb()) {
  render(
    <AppDataProvider db={db}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/knowledge/recipes" element={<RecipeListPage />} />
          <Route path="/knowledge/recipes/new" element={<RecipeFormPage />} />
          <Route path="/knowledge/recipes/:recipeId/edit" element={<RecipeFormPage />} />
          <Route path="/knowledge/recipes/:recipeId" element={<RecipePage />} />
        </Routes>
        <Where />
      </MemoryRouter>
    </AppDataProvider>,
  );
  return db;
}

/** Writes a recipe through the form and lands on its page. */
async function createRecipe() {
  await userEvent.type(await screen.findByLabelText(t.form.title), 'Milchreis');
  await userEvent.type(screen.getByLabelText(t.form.minutes), '40');
  await userEvent.type(screen.getByLabelText(t.form.servings), '2');
  await userEvent.click(screen.getByLabelText(t.form.ingredients));
  await userEvent.paste('• 1 l Milch\n\n2. 200 g Reis\n- Zimt');
  await userEvent.click(screen.getByLabelText(t.form.steps));
  await userEvent.paste('1. Milch erwärmen.\n2. Reis dazugeben.');
  await userEvent.click(screen.getByRole('button', { name: t.form.save }));
  await screen.findByRole('heading', { level: 1, name: 'Milchreis' });
}

describe('own recipes in the UI (ADR-0048, point 7)', () => {
  afterEach(cleanup);

  it('creates a recipe from pasted text and shows it with Da / Fehlt and the steps', async () => {
    renderApp('/knowledge/recipes/new');
    await createRecipe();
    expect(screen.getByText('40 Min. · 2 Portionen')).toBeDefined();
    // Nothing at home: every ingredient is missing, and one tap puts them on the list.
    expect(screen.getByText('200 g Reis')).toBeDefined();
    expect(screen.getByText('Zimt')).toBeDefined();
    expect(screen.queryByText('• 1 l Milch')).toBeNull();
    expect(screen.getByRole('button', { name: t.toList })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: t.toList }));
    expect(await screen.findByText(t.onList(3))).toBeDefined();
    expect(screen.getByText('Reis dazugeben.')).toBeDefined();
    expect(screen.getByRole('button', { name: t.edit })).toBeDefined();
  });

  it('asks for a title and an ingredient before saving', async () => {
    const db = renderApp('/knowledge/recipes/new');
    await userEvent.click(await screen.findByRole('button', { name: t.form.save }));
    expect((await screen.findByRole('alert')).textContent).toBe(t.form.needTitle);
    await userEvent.type(screen.getByLabelText(t.form.title), 'Suppe');
    await userEvent.click(screen.getByRole('button', { name: t.form.save }));
    expect(screen.getByRole('alert').textContent).toBe(t.form.needIngredients);
    await userEvent.type(screen.getByLabelText(t.form.ingredients), 'Karotten');
    await userEvent.type(screen.getByLabelText(t.form.minutes), 'viel');
    await userEvent.click(screen.getByRole('button', { name: t.form.save }));
    expect(screen.getByRole('alert').textContent).toBe(t.form.needNumber);
    expect(await db.ownRecipes.count()).toBe(0);
  });

  it('edits a recipe, starting from its values', async () => {
    renderApp('/knowledge/recipes/new');
    await createRecipe();
    await userEvent.click(screen.getByRole('button', { name: t.edit }));
    const title = await screen.findByLabelText(t.form.title);
    expect((title as HTMLInputElement).value).toBe('Milchreis');
    expect(screen.getByLabelText<HTMLTextAreaElement>(t.form.ingredients).value).toBe(
      '1 l Milch\n200 g Reis\nZimt',
    );
    await userEvent.clear(title);
    await userEvent.type(title, 'Reisbrei');
    await userEvent.clear(screen.getByLabelText(t.form.minutes));
    await userEvent.click(screen.getByRole('button', { name: t.form.save }));
    await screen.findByRole('heading', { level: 1, name: 'Reisbrei' });
    expect(screen.getByText('2 Portionen')).toBeDefined();
  });

  it('deletes only after a confirmation on the page, and lists recipes under «Meine Rezepte»', async () => {
    const db = renderApp('/knowledge/recipes/new');
    await createRecipe();
    await userEvent.click(screen.getByRole('button', { name: t.delete }));
    // Cancelling keeps the recipe.
    await userEvent.click(screen.getByRole('button', { name: t.cancel }));
    expect(await db.ownRecipes.count()).toBe(1);
    expect(screen.getByRole('button', { name: t.delete })).toBeDefined();

    await userEvent.click(screen.getByRole('button', { name: t.delete }));
    expect(screen.getByText(t.deleteAsk)).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: t.deleteYes }));
    await screen.findByRole('heading', { level: 1, name: t.allTitle });
    expect(screen.getByTestId('where').textContent).toBe('/knowledge/recipes');
    expect(await screen.findByText(t.ownTitle)).toBeDefined();
    expect(screen.queryByText('Milchreis')).toBeNull();
    // The add row is always there.
    expect(screen.getByRole('link', { name: new RegExp(t.addRecipe) })).toBeDefined();
  });

  it('says so for the edit page of a recipe that is not yours', async () => {
    renderApp('/knowledge/recipes/bananen-pancakes/edit');
    expect(await screen.findByText(t.notFound)).toBeDefined();
  });
});
