import { messages } from '../../app/messages.de-CH';
import { Card } from '../../ui/Card';
import { AllRecipes } from './AllRecipes';
import { RecipeIdeas } from './RecipeIdeas';

const t = messages.recipes;

/**
 * «Kochen» (ADR-0031): first the recipes that rescue what expires soon, the most urgent first, then
 * all recipes, what can be cooked with the food at home first.
 */
export function CookPage() {
  return (
    <div className="space-y-6 pb-8">
      <h1 className="large-title">{messages.pages.cook}</h1>
      <RecipeIdeas
        limit={10}
        title={t.rescueTitle}
        empty={
          <Card>
            <p className="text-ink-muted">{t.nothingExpiring}</p>
          </Card>
        }
      />
      <AllRecipes />
    </div>
  );
}
