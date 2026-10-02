import { Geometry, Mesh, Program } from 'ogl';
import type { ShaderSceneSetup } from '../ShaderCanvas';
import { hexToRgb } from './fullscreen';

/*
 * Adapted from React Bits "Particles" (https://reactbits.dev/backgrounds/particles): the same
 * per-particle random attributes and soft point sprites, re-aimed so they rise like embers.
 */
const vertex = /* glsl */ `
attribute vec4 random;
attribute vec3 color;

uniform float uTime;
uniform float uPixelRatio;
uniform vec2 uPointer;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float life = fract(random.y + uTime * mix(0.025, 0.09, random.x));
  float sway = sin(uTime * mix(0.4, 1.1, random.w) + random.y * 6.2831) * 0.05;
  float x = random.z * 2.2 - 1.1 + sway * (0.4 + life) + (uPointer.x - 0.5) * 0.18 * life;
  float y = life * 2.3 - 1.15;

  gl_Position = vec4(x, y, 0.0, 1.0);
  gl_PointSize = mix(2.0, 9.0, random.w * random.w) * uPixelRatio * (1.0 - life * 0.55);

  float flicker = 0.6 + 0.4 * sin(uTime * mix(2.0, 7.0, random.x) + random.z * 40.0);
  vColor = color;
  vAlpha = sin(life * 3.14159) * flicker * (1.0 - life * 0.6);
}
`;

const fragment = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vAlpha;

void main() {
  float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  float alpha = glow * glow * vAlpha;
  gl_FragColor = vec4(vColor * alpha, alpha);
}
`;

const PARTICLE_COUNT = 150;
const palette = ['#fd8537', '#f1453b', '#ffc56b', '#fd8537'].map(hexToRgb);

/** Calories: embers drifting up from the bottom edge, leaning toward the pointer like heat. */
export const emberScene: ShaderSceneSetup = (gl) => {
  const randoms = new Float32Array(PARTICLE_COUNT * 4);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], index * 4);
    colors.set(palette[index % palette.length] ?? [1, 1, 1], index * 3);
  }

  const uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uPointer: { value: [0.5, 0.5] },
  };
  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms,
    transparent: true,
    depthTest: false,
  });
  program.setBlendFunc(gl.ONE, gl.ONE);
  const geometry = new Geometry(gl, {
    random: { size: 4, data: randoms },
    color: { size: 3, data: colors },
  });

  return {
    mesh: new Mesh(gl, { geometry, mode: gl.POINTS, program }),
    resize: (width) => {
      uniforms.uPixelRatio.value = Math.max(1, width / Math.max(1, gl.canvas.clientWidth));
    },
    update: (seconds, pointer) => {
      uniforms.uTime.value = seconds;
      uniforms.uPointer.value = [pointer.x, pointer.y];
    },
  };
};
