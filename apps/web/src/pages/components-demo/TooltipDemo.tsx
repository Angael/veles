import { Btn } from '@/components/ui/btn/Btn';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';

export function TooltipDemo() {
  return (
    <section>
      <h2>Tooltip</h2>
      <Tooltip content='Warm-up: light set before working sets, not counted'>
        <Btn variant='ghost'>Hover me</Btn>
      </Tooltip>
    </section>
  );
}
