import { useEffect, useState } from 'react';
import type { PageAccent } from '@/components/app/app-frame/pageAccent';
import css from './PageBackdrop.module.css';
import { ShaderCanvas, type ShaderSceneSetup } from './ShaderCanvas';

type SceneAccent = Exclude<PageAccent, 'account'>;

/** Each feature owns one React Bits background; they load lazily so only the visited one ships. */
const scenes: Record<SceneAccent, { load: () => Promise<ShaderSceneSetup>; maxDpr: number }> = {
  home: { load: () => import('./scenes/auroraScene').then((m) => m.auroraScene), maxDpr: 0.5 },
  calories: { load: () => import('./scenes/emberScene').then((m) => m.emberScene), maxDpr: 1.5 },
  weight: { load: () => import('./scenes/threadsScene').then((m) => m.threadsScene), maxDpr: 1 },
  recipes: {
    load: () => import('./scenes/lightRaysScene').then((m) => m.lightRaysScene),
    maxDpr: 0.6,
  },
  todos: { load: () => import('./scenes/lineWavesScene').then((m) => m.lineWavesScene), maxDpr: 1 },
  diary: {
    load: () => import('./scenes/grainientScene').then((m) => m.grainientScene),
    maxDpr: 0.75,
  },
};

type Layer = { accent: SceneAccent; leaving: boolean; setup: ShaderSceneSetup };

const CROSSFADE_MS = 900;

/**
 * Fixed, decorative layer behind every page: a breathing accent halo, the feature's WebGL scene,
 * film grain, and a vignette that keeps the neutral base dominant. Scenes crossfade on navigation
 * so two features never cut abruptly into each other.
 */
export function PageBackdrop({ accent, dimmed }: { accent: PageAccent; dimmed: boolean }) {
  const [layers, setLayers] = useState<Layer[]>([]);

  useEffect(() => {
    let cancelled = false;
    let sweep = 0;
    // Retired layers fade out via CSS, then a sweep unmounts them and frees their WebGL context.
    const swapTo = (next: Layer | null) => {
      setLayers((current) => [
        ...current
          .filter((layer) => layer.accent !== next?.accent)
          .map((layer) => ({ ...layer, leaving: true })),
        ...(next ? [next] : []),
      ]);
      sweep = window.setTimeout(() => {
        setLayers((current) => current.filter((layer) => !layer.leaving));
      }, CROSSFADE_MS);
    };

    if (accent === 'account') {
      swapTo(null);
    } else {
      void scenes[accent]
        .load()
        .then((setup) => {
          if (!cancelled) swapTo({ accent, leaving: false, setup });
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(sweep);
    };
  }, [accent]);

  return (
    <div aria-hidden='true' className={css.backdrop} data-dimmed={dimmed || undefined}>
      <div className={css.halo} />
      {layers.map((layer) => (
        <div
          className={css.layer}
          data-leaving={layer.leaving || undefined}
          data-scene={layer.accent}
          key={layer.accent}
        >
          <ShaderCanvas
            className={css.canvas}
            maxDpr={scenes[layer.accent].maxDpr}
            setup={layer.setup}
          />
        </div>
      ))}
      <div className={css.grain} />
      <div className={css.vignette} />
    </div>
  );
}
