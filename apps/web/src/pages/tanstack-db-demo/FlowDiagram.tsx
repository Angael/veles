import { ArrowRightIcon } from 'lucide-react';
import css from './TanstackDbDemoPage.module.css';

export type FlowStep = {
  detail?: string;
  label: string;
  tone?: 'client' | 'error' | 'server' | 'ui';
};

/** Horizontal chain of boxes and arrows; wraps on phones. Used for request timelines. */
export function FlowDiagram({ label, steps }: { label: string; steps: FlowStep[] }) {
  return (
    <ol aria-label={label} className={css.flow}>
      {steps.map((step, index) => (
        <li data-tone={step.tone} key={`${index}-${step.label}`}>
          {index > 0 ? <ArrowRightIcon aria-hidden='true' className={css.flowArrow} /> : null}
          <div className={css.flowBox}>
            <strong>{step.label}</strong>
            {step.detail ? <span>{step.detail}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
