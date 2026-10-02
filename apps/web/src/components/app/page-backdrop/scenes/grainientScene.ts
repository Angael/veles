import type { ShaderSceneSetup } from '../ShaderCanvas';
import { createFullscreenMesh, glsl300Vertex, hexToRgb } from './fullscreen';

/* Adapted from React Bits "Grainient" (https://reactbits.dev/backgrounds/grainient). */
const fragment = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 uPointer;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

out vec4 fragColor;

#define S(a,b,t) smoothstep(a,b,t)

mat2 Rot(float a) {
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
  return fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  float n = mix(
    mix(dot(-1.0 + 2.0 * hash(i), f), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
  return 0.5 + 0.5 * n;
}

void main() {
  float t = iTime * 0.16;
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float ratio = iResolution.x / iResolution.y;
  vec2 tuv = uv - 0.5 + (uPointer - 0.5) * 0.08;
  tuv /= 0.9;

  float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) * 2.0);
  tuv.y *= 1.0 / ratio;
  tuv *= Rot(radians((degree - 0.5) * 500.0 + 180.0));
  tuv.y *= ratio;

  float amplitude = 50.0;
  float warpTime = t * 2.0;
  tuv.x += sin(tuv.y * 5.0 + warpTime) / amplitude;
  tuv.y += sin(tuv.x * 7.5 + warpTime) / (amplitude * 0.5);

  float blendX = tuv.x;
  vec3 layer1 = mix(uColor3, uColor2, S(-0.35, 0.25, blendX));
  vec3 layer2 = mix(uColor2, uColor1, S(-0.35, 0.25, blendX));
  vec3 col = mix(layer1, layer2, S(0.55, -0.35, tuv.y));

  float grain = fract(sin(dot(uv * 2.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.09;
  col = clamp((col - 0.5) * 1.35 + 0.5, 0.0, 1.0);

  fragColor = vec4(col, 1.0);
}
`;

/** Diary: a slow ink wash with film grain, like watercolor bleeding into journal paper. */
export const grainientScene: ShaderSceneSetup = (gl) => {
  const uniforms = {
    iResolution: { value: [1, 1] },
    iTime: { value: 0 },
    uPointer: { value: [0.5, 0.5] },
    uColor1: { value: hexToRgb('#b296ff') },
    uColor2: { value: hexToRgb('#5f7ceb') },
    uColor3: { value: hexToRgb('#0a0a0a') },
  };

  return {
    mesh: createFullscreenMesh(gl, fragment, uniforms, glsl300Vertex),
    resize: (width, height) => {
      uniforms.iResolution.value = [width, height];
    },
    update: (seconds, pointer) => {
      uniforms.iTime.value = seconds;
      uniforms.uPointer.value = [pointer.x, pointer.y];
    },
  };
};
