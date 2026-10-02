import { Renderer, type Mesh, type OGLRenderingContext } from 'ogl';
import { useEffect, useRef } from 'react';

/** Smoothed pointer position across the viewport, 0..1 with y pointing up. */
export type ScenePointer = { x: number; y: number };

export type ShaderScene = {
  mesh: Mesh;
  /** Receives the drawing buffer size in device pixels. */
  resize?: (width: number, height: number) => void;
  update: (seconds: number, pointer: ScenePointer) => void;
};

export type ShaderSceneSetup = (gl: OGLRenderingContext) => ShaderScene;

type ShaderCanvasProps = {
  className?: string;
  /** Soft effects look identical at low resolution, so most scenes render below device pixels. */
  maxDpr?: number;
  setup: ShaderSceneSetup;
};

/**
 * Shared ogl runtime for the React Bits backgrounds. Mounts one canvas, keeps it sized to its
 * container, eases the pointer, pauses while the tab is hidden, and paints a single still frame
 * for reduced motion. Missing WebGL leaves the container empty so the CSS ambience still shows.
 */
export function ShaderCanvas({ className, maxDpr = 1, setup }: ShaderCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    let scene: ShaderScene;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, maxDpr),
        premultipliedAlpha: true,
      });
      renderer.gl.clearColor(0, 0, 0, 0);
      scene = setup(renderer.gl);
    } catch {
      return;
    }

    const { gl } = renderer;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    const target: ScenePointer = { x: 0.5, y: 0.5 };
    const pointer: ScenePointer = { x: 0.5, y: 0.5 };
    let frame = 0;

    const render = (now: number) => {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      scene.update((now - start) / 1000, pointer);
      renderer.render({ scene: scene.mesh });
    };

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      scene.resize?.(gl.canvas.width, gl.canvas.height);
      if (reducedMotion) render(start + 6000);
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!document.hidden) render(now);
    };

    const trackPointer = (event: PointerEvent) => {
      target.x = event.clientX / window.innerWidth;
      target.y = 1 - event.clientY / window.innerHeight;
    };

    gl.canvas.style.display = 'block';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    container.append(gl.canvas);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    if (!reducedMotion) {
      window.addEventListener('pointermove', trackPointer, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', trackPointer);
      gl.canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [maxDpr, setup]);

  return <div aria-hidden='true' className={className} ref={containerRef} />;
}
