import { useQuery } from '@tanstack/react-query';
import { FileTextIcon, ListChecksIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react';
import { useState } from 'react';
import { notesQueryOptions } from '@/pages/todos/notes.query';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { List, ListItem } from '@/components/ui/list/List';
import type { RecipeLibraryItem } from '../recipes.api';
import { useAddRecipeToNoteMutation } from '../recipes.query';
import { ingredientLine } from './ingredientLine';
import css from './AddToNoteAction.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = { portions: number; recipe: RecipeLibraryItem };

/**
 * Adds the ingredients, scaled to the picked portions, to a note the user picks: an own note, a
 * note a connection shares, or a new shopping list.
 */
export function AddToNoteAction({ portions, recipe }: Props) {
  const { formatNumber, t } = useI18n();
  const [open, setOpen] = useState(false);
  const notesQuery = useQuery({ ...notesQueryOptions(), enabled: open });
  const addMutation = useAddRecipeToNoteMutation();
  const scale = portions / Math.max(1, recipe.portions);
  const items = recipe.ingredients.map((ingredient) =>
    ingredientLine(ingredient, scale, formatNumber),
  );

  function add(noteId: string | null) {
    addMutation.mutate(
      { items, noteId, title: t({ en: 'Shopping list', pl: 'Lista zakupów' }) },
      { onSuccess: () => setOpen(false) },
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <Btn
        icon={<ShoppingCartIcon aria-hidden='true' />}
        onClick={() => setOpen(true)}
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add to shopping list', pl: 'Dodaj do listy zakupów' })}
      </Btn>
      <DialogRoot onOpenChange={setOpen} open={open}>
        <DialogPopup>
          <DialogTitle>{t({ en: 'Add to a note', pl: 'Dodaj do notatki' })}</DialogTitle>
          <DialogDescription>
            {t({
              en: `${items.length} ingredients for ${formatNumber(portions)} portions.`,
              pl: `Składniki: ${items.length}, porcje: ${formatNumber(portions)}.`,
            })}
          </DialogDescription>
          <List aria-busy={notesQuery.isPending || addMutation.isPending}>
            <ListItem interactive>
              <button
                className={css.option}
                disabled={addMutation.isPending}
                onClick={() => add(null)}
                type='button'
              >
                <PlusIcon aria-hidden='true' />
                <span>{t({ en: 'New shopping list', pl: 'Nowa lista zakupów' })}</span>
              </button>
            </ListItem>
            {(notesQuery.data ?? []).map((note) => (
              <ListItem interactive key={note.id}>
                <button
                  className={css.option}
                  disabled={addMutation.isPending}
                  onClick={() => add(note.id)}
                  type='button'
                >
                  {note.type === 'shopping_list' ? (
                    <ListChecksIcon aria-hidden='true' />
                  ) : (
                    <FileTextIcon aria-hidden='true' />
                  )}
                  <span>{note.title}</span>
                  {note.isOwned ? null : (
                    <small>{t({ en: `from ${note.ownerName}`, pl: `od ${note.ownerName}` })}</small>
                  )}
                </button>
              </ListItem>
            ))}
          </List>
          <DialogActions>
            <DialogClose render={<Btn type='button' variant='ghost' />}>
              {t({ en: 'Cancel', pl: 'Anuluj' })}
            </DialogClose>
          </DialogActions>
        </DialogPopup>
      </DialogRoot>
    </>
  );
}
