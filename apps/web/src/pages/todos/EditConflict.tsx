import { Btn } from '@/components/ui/btn/Btn';
import css from './TodosPage.module.css';

type EditConflictProps = {
  onAcceptTheirs: () => void;
  onKeepMine: () => void;
  theirs: string;
};

export function EditConflict({ onAcceptTheirs, onKeepMine, theirs }: EditConflictProps) {
  return (
    <div className={css.conflict} role='alert'>
      <p>Someone else changed this while you were editing. Their version:</p>
      <p className={css.conflictTheirs}>{theirs}</p>
      <div className={css.conflictActions}>
        <Btn onClick={onAcceptTheirs} size='sm' type='button' variant='outlineMain'>
          Use theirs
        </Btn>
        <Btn onClick={onKeepMine} size='sm' type='button'>
          Keep mine
        </Btn>
      </div>
    </div>
  );
}
