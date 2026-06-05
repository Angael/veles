import { createFileRoute, notFound } from '@tanstack/react-router';
import { getRecipeById } from '@/pages/recipes/recipes.api';

export const Route = createFileRoute('/recipes/view/$id')({
  loader: async ({ params }) => {
    const recipe = await getRecipeById({ data: { id: params.id } });

    if (!recipe) {
      throw notFound();
    }

    return recipe;
  },
  component: RecipeViewPage,
});

function RecipeViewPage() {
  const recipe = Route.useLoaderData();

  return (
    <main>
      <h1>{recipe.name}</h1>

      <p>{recipe.description}</p>

      <section>
        <h2>Meta</h2>
        <p>ID: {recipe.id}</p>
        <p>Rating: {recipe.rating}/5</p>
        <p>Created: {recipe.createdAt}</p>
        <p>Updated: {recipe.updatedAt}</p>
      </section>

      <section>
        <h2>Ingredients</h2>
        <ul>
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Tags</h2>
        {recipe.tags.length ? (
          <ul>
            {recipe.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : (
          <p>No tags</p>
        )}
      </section>

      <section>
        <h2>Nutrition</h2>
        <ul>
          <li>kcal: {recipe.nutrition.kcal ?? 'Unknown'}</li>
          <li>protein: {recipe.nutrition.protein ?? 'Unknown'}</li>
          <li>carbs: {recipe.nutrition.carbs ?? 'Unknown'}</li>
          <li>fats: {recipe.nutrition.fats ?? 'Unknown'}</li>
        </ul>
      </section>

      <section>
        <h2>Images</h2>
        {recipe.images.length ? (
          <ul>
            {recipe.images.map((image) => (
              <li key={image.url}>
                <a href={image.url} rel='noreferrer' target='_blank'>
                  {image.url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No images</p>
        )}
      </section>
    </main>
  );
}
