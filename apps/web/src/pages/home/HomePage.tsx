import { Link } from '@tanstack/react-router';
import {
  ArrowUpRightIcon,
  DumbbellIcon,
  FolderLockIcon,
  ScaleIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './HomePage.module.css';

export function HomePage() {
  return (
    <main className={css.layout}>
      <Card as='article' className={css.hero} data-appear variant='primary'>
        <span aria-hidden='true' className={css.monogram}>
          V
        </span>
        <div aria-hidden='true' className={css.energyLine} />
        <div className={css.heroContent}>
          <h1>
            Your data.
            <br />
            In your orbit.
          </h1>
          <p>
            Veles keeps workouts, body weight, food logging, and shared personal files together in
            one private hub.
          </p>
          <div className={css.buttonRow}>
            <Btn
              icon={<ArrowUpRightIcon aria-hidden='true' size={18} />}
              isLink
              render={<Link to={'/login'} />}
              size='lg'
              variant='main'
            >
              Log in
            </Btn>
          </div>
        </div>
      </Card>

      <Card as='article' className={css.workoutTile} data-appear='1' shadow={false}>
        <div className={css.tileHeading}>
          <DumbbellIcon aria-hidden='true' size={22} />
          <h2>Workouts</h2>
        </div>
        <p>Track sessions, exercises, and notes across training blocks.</p>
        <div aria-hidden='true' className={css.setSequence}>
          <span>WARM</span>
          <i />
          <span>WORK</span>
          <i />
          <span>LOG</span>
        </div>
      </Card>

      <Card as='article' className={css.weightTile} data-appear='2'>
        <div className={css.weightCopy}>
          <div className={css.tileHeading}>
            <ScaleIcon aria-hidden='true' size={22} />
            <h2>Body weight</h2>
          </div>
          <p>Log privately and see long-term direction without losing the daily detail.</p>
        </div>
        <div aria-hidden='true' className={css.trend}>
          <span className={css.trendValue}>72.4</span>
          <span className={css.trendUnit}>kg</span>
          <svg viewBox='0 0 180 54'>
            <path d='M2 42 C28 35, 38 45, 61 31 S102 35, 123 20 S153 22, 178 8' />
          </svg>
        </div>
      </Card>

      <Card as='article' className={css.foodTile} data-appear='3' shadow={false}>
        <div className={css.tileHeading}>
          <UtensilsIcon aria-hidden='true' size={22} />
          <h2>Food logging</h2>
        </div>
        <p>Record meals, calories, and macros with a compact daily view.</p>
        <dl className={css.macros}>
          <div>
            <dt>kcal</dt>
            <dd>2,180</dd>
          </div>
          <div>
            <dt>protein</dt>
            <dd>148g</dd>
          </div>
          <div>
            <dt>fat</dt>
            <dd>72g</dd>
          </div>
          <div>
            <dt>carbs</dt>
            <dd>224g</dd>
          </div>
        </dl>
      </Card>

      <Card as='article' className={css.filesTile} data-appear='4'>
        <div className={css.filesCopy}>
          <div className={css.tileHeading}>
            <FolderLockIcon aria-hidden='true' size={22} />
            <h2>Shared personal files</h2>
          </div>
          <p>Keep important files together in private, upload-ready storage.</p>
        </div>
        <div aria-hidden='true' className={css.fileStack}>
          <span>health.pdf</span>
          <span>progress.jpg</span>
          <span>notes.txt</span>
        </div>
      </Card>
    </main>
  );
}
