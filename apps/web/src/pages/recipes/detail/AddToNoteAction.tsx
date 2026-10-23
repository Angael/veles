import { useQuery } from '@tanstack/react-query';
import { FileTextIcon, ListChecksIcon, NotebookPenIcon, PlusIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
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

type Props = { portions: number; recipe: RecipeLibraryItem; scale: number };

/**
 * Adds the ingredients, scaled to the picked portions, to a note the user picks: an own note, a
 * note a connection shares, or a new shopping list.
 */
export function AddToNoteAction({ portions, recipe, scale }: Props) {
  const { formatNumber, formatWhole, t } = useI18n();
  const [open, setOpen] = useState(false);
  // Fetched with the page so the picker opens with the notes already listed.
  const notesQuery = useQuery(notesQueryOptions());
  const navigate = useNavigate();
  const addMutation = useAddRecipeToNoteMutation();
  const items = recipe.ingredients.map((ingredient) =>
    ingredientLine(ingredient, scale, formatWhole),
  );

  function add(noteId: string | null) {
    addMutation.mutate(
      { items, noteId, title: t({ en: 'Shopping list', pl: 'Lista zakupów' }) },
      {
        onSuccess: (note) => {
          setOpen(false);
          void navigate({ hash: `note-${note.id}`, to: '/todos' });
        },
      },
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <Btn
        icon={<NotebookPenIcon aria-hidden='true' />}
        onClick={() => setOpen(true)}
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Add to notes', pl: 'Dodaj do notatek' })}
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
