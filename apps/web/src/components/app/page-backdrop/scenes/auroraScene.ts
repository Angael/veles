import type { ShaderSceneSetup } from '../ShaderCanvas';
import { createFullscreenMesh, glsl300Vertex, hexToRgb } from './fullscreen';

/* Adapted from React Bits "Aurora" (https://reactbits.dev/backgrounds/aurora). */
const fragment = /* glsl */ `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 ramp(float factor) {
  if (factor < 0.5) return mix(uColorStops[0], uColorStops[1], factor * 2.0);
  return mix(uColorStops[1], uColorStops[2], (factor - 0.5) * 2.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 rampColor = ramp(clamp(uv.x + (uPointer.x - 0.5) * 0.25, 0.0, 1.0));

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  fragColor = vec4(intensity * rampColor * auroraAlpha, auroraAlpha);
}
`;

/** Home: a prism of every feature accent drifting across the top of the dashboard. */
export const auroraScene: ShaderSceneSetup = (gl) => {
  const uniforms = {
    uTime: { value: 0 },
    uAmplitude: { value: 1.1 },
    uColorStops: { value: ['#b296ff', '#43d5dc', '#f471aa'].map(hexToRgb) },
    uResolution: { value: [1, 1] },
    uPointer: { value: [0.5, 0.5] },
    uBlend: { value: 0.6 },
  };

  return {
    mesh: createFullscreenMesh(gl, fragment, uniforms, glsl300Vertex),
    resize: (width, height) => {
      uniforms.uResolution.value = [width, height];
    },
    update: (seconds, pointer) => {
      uniforms.uTime.value = seconds * 0.55;
      uniforms.uPointer.value = [pointer.x, pointer.y];
    },
  };
};
