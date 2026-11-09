import { type CSSProperties, useEffect, useState } from 'react';

/**
 * On touch devices, returns styles that pin a fixed full-screen sheet to the part of the screen above the on-screen
 * keyboard. Android Chrome overlays the keyboard without resizing the layout and may also shift
 * the visible area, so `100dvh` alone hides the sheet's bottom under the keyboard.
 */
export function useVisibleViewport(active: boolean): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>();
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport || !window.matchMedia('(pointer: coarse)').matches) return;
    const update = () => setStyle({ height: viewport.height, top: viewport.offsetTop });
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [active]);
  return active ? style : undefined;
}
