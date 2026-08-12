import { Link } from '@tanstack/react-router';
import {
  ActivityIcon,
  ArrowRightIcon,
  DumbbellIcon,
  FileLock2Icon,
  ScaleIcon,
  ShieldCheckIcon,
  UtensilsIcon,
} from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './HomePage.module.css';

const modules = [
  {
    code: 'TRN',
    title: 'Workouts',
    description: 'Record sessions, exercises, and the notes that give each training block context.',
    Icon: DumbbellIcon,
  },
  {
    code: 'WGT',
    title: 'Body weight',
    description:
      'Log weigh-ins privately and read the longer trend without losing the daily record.',
    Icon: ScaleIcon,
  },
  {
    code: 'FOD',
    title: 'Food log',
    description: 'Keep meals, calories, and macros together in one practical daily record.',
    Icon: UtensilsIcon,
  },
  {
    code: 'FIL',
    title: 'Personal files',
    description: 'Upload and share personal files from the same private hub.',
    Icon: FileLock2Icon,
  },
] as const;

export function HomePage() {
  return (
    <main className={css.layout}>
      <Card as='section' className={css.hero} shadow={false}>
        <div className={css.heroLead}>
          <div className={css.statusLine}>
            <span className={css.signal} aria-hidden='true' />
            <span>Access boundary: private</span>
            <span className={css.statusCode}>VEL / HOME</span>
          </div>

          <div className={css.heroCopy}>
            <h1>
              Your personal records,
              <span>under one roof.</span>
            </h1>
            <p>
              Veles keeps workouts, body weight, food logging, and shared personal files in one
              focused workspace.
            </p>
          </div>

          <div className={css.actions}>
            <Btn
              icon={<ActivityIcon aria-hidden='true' />}
              isLink
              render={<Link to={'/weight'} />}
              size='lg'
              variant='main'
            >
              Preview weight tracker
            </Btn>
            <Btn
              icon={<ArrowRightIcon aria-hidden='true' />}
              isLink
              render={<Link to={'/login'} />}
              size='lg'
              variant='outlineMain'
            >
              Open login
            </Btn>
          </div>
        </div>

        <aside className={css.heroConsole} aria-label='Veles capability overview'>
          <div className={css.consoleHeader}>
            <span>System map</span>
            <ShieldCheckIcon aria-hidden='true' />
          </div>
          <div className={css.consoleBody}>
            <div className={css.axisLabel}>CAPABILITY BUS / 04 MODULES</div>
            <ul className={css.consoleList}>
              {modules.map(({ code, title, Icon }) => (
                <li key={code}>
                  <span className={css.moduleCode}>{code}</span>
                  <Icon aria-hidden='true' />
                  <span>{title}</span>
                  <span className={css.readyLabel}>AVAILABLE</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={css.consoleFooter}>
            <span>Private workspace</span>
            <span>One account</span>
          </div>
        </aside>
      </Card>

      <section className={css.modules} aria-labelledby='module-heading'>
        <header className={css.sectionHeader}>
          <div>
            <span className={css.sectionIndex}>01—04</span>
            <h2 id='module-heading'>Connected records</h2>
          </div>
          <p>Four practical tools. One place to return to.</p>
        </header>

        <div className={css.moduleGrid}>
          {modules.map(({ code, title, description, Icon }, index) => (
            <Card as='article' className={css.module} key={code} shadow={false}>
              <div className={css.moduleTopline}>
                <span>{code}</span>
                <span>0{index + 1}</span>
              </div>
              <Icon aria-hidden='true' className={css.moduleIcon} />
              <h3>{title}</h3>
              <p>{description}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
