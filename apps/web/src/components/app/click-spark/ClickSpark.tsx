import { useEffect, useRef } from 'react';
import css from './ClickSpark.module.css';

type Spark = { angle: number; color: string; start: number; x: number; y: number };

const SPARK_COUNT = 8;
const SPARK_RADIUS = 22;
const SPARK_SIZE = 10;
const DURATION_MS = 420;

/**
 * Adapted from React Bits "Click Spark" (https://reactbits.dev/animations/click-spark). One fixed
 * canvas listens to pointer clicks app-wide and bursts sparks in the accent of whatever was
 * clicked, so a tap on a home tile sparks in that feature's color. It only animates while sparks
 * are alive and stays off for keyboard activation and reduced motion.
 */
export function ClickSpark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let sparks: Spark[] = [];
    let frame = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((spark) => {
        const progress = (now - spark.start) / DURATION_MS;
        if (progress >= 1) return false;

        const eased = progress * (2 - progress);
        const distance = eased * SPARK_RADIUS;
        const length = SPARK_SIZE * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);

        context.strokeStyle = spark.color;
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.beginPath();
        context.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        context.lineTo(spark.x + (distance + length) * cos, spark.y + (distance + length) * sin);
        context.stroke();
        return true;
      });

      frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const burst = (event: MouseEvent) => {
      // Keyboard-triggered clicks report detail 0 and have no meaningful coordinates.
      if (event.detail === 0 || !(event.target instanceof Element)) return;

      const accent = getComputedStyle(event.target).getPropertyValue('--c-accent').trim();
      const start = performance.now();
      for (let index = 0; index < SPARK_COUNT; index += 1) {
        sparks.push({
          angle: (2 * Math.PI * index) / SPARK_COUNT,
          color: accent || 'white',
          start,
          x: event.clientX,
          y: event.clientY,
        });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('click', burst, { capture: true, passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', burst, { capture: true });
    };
  }, []);

  return <canvas aria-hidden='true' className={css.canvas} ref={canvasRef} />;
}
