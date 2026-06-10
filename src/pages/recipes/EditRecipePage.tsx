import { SaveIcon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import type { RecipeDetail } from './recipes.data';
import css from './EditRecipePage.module.css';

type EditRecipePageProps = {
  recipe: RecipeDetail;
};

export function EditRecipePage({ recipe }: EditRecipePageProps) {
  return (
    <main className={css.page}>
      <Card as='section' className={css.card}>
        <div className={css.copy}>
          <h1>Edit {recipe.name}</h1>
          <p>
            This placeholder route exists to test app-level up navigation before the form lands.
          </p>
        </div>

        <Btn disabled icon={<SaveIcon aria-hidden='true' size={18} />} variant='main'>
          Save changes
        </Btn>
      </Card>
    </main>
  );
}
