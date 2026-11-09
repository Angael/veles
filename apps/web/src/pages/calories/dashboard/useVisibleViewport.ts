import { type CSSProperties, useEffect, useState } from 'react';

/**
 * While open, asks Chrome to resize the layout above the keyboard and its autofill strip; the
 * default only overlays them. Restored on close so the rest of the app keeps its usual behaviour.
 */
function resizeLayoutForKeyboard() {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta || meta.content.includes('interactive-widget')) return () => {};
  const original = meta.content;
  meta.content = `${original}, interactive-widget=resizes-content`;
  return () => {
    meta.content = original;
  };
}

/**
 * On touch devices, returns styles that pin a fixed full-screen sheet to the area above the
 * on-screen keyboard. Android Chrome overlays the keyboard and may shift the visible area, so
 * `100dvh` alone hides the sheet's bottom under the keyboard.
 */
export function useVisibleViewport(active: boolean): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>();
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport || !window.matchMedia('(pointer: coarse)').matches) return;
    const restoreViewport = resizeLayoutForKeyboard();
    const update = () =>
      // Round outward: a sub-pixel overlap hides under the keyboard, a gap shows the page through.
      setStyle({ height: Math.ceil(viewport.height) + 1, top: Math.floor(viewport.offsetTop) });
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      restoreViewport();
    };
  }, [active]);
  return active ? style : undefined;
}
