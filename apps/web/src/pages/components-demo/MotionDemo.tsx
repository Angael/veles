import { useState } from 'react';
import { BlurText } from '@/components/ui/blur-text/BlurText';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { CountUp } from '@/components/ui/count-up/CountUp';
import css from './ComponentsDemoPage.module.css';

/** Replayable showcase for the React Bits-derived text animations. */
export function MotionDemo() {
  const [round, setRound] = useState(0);
  const [kcal, setKcal] = useState(1840);

  return (
    <section>
      <h2>BlurText and CountUp</h2>
      <div className={css.cardRow}>
        <Card as='article' tone='accent'>
          <h3>
            <BlurText key={round} text='Every page breathes' />
          </h3>
          <Btn onClick={() => setRound(round + 1)} size='sm' variant='outlineMain'>
            Replay
          </Btn>
        </Card>
        <Card as='article'>
          <h3>
            <CountUp value={kcal} /> kcal
          </h3>
          <Btn onClick={() => setKcal(kcal + 250)} size='sm' variant='outlineMain'>
            Log 250 kcal
          </Btn>
        </Card>
      </div>
    </section>
  );
}
