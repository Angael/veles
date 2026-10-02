import type { ShaderSceneSetup } from '../ShaderCanvas';
import { createFullscreenMesh, hexToRgb } from './fullscreen';

/* Adapted from React Bits "Light Rays" (https://reactbits.dev/backgrounds/light-rays). */
const fragment = /* glsl */ `
precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 rayPos;
uniform vec2 rayDir;
uniform vec3 raysColor;
uniform vec3 raysColor2;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float fadeDistance;
uniform vec2 mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);
  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = 0.85 + 0.15 * sin(iTime * speed * 1.5);

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  vec2 mouseDirection = normalize(mousePos * iResolution.xy - rayPos);
  vec2 finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));

  float rays1 = rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  float rays2 = rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);

  float n = noise(coord * 0.01 + iTime * 0.1);
  float brightness = 1.0 - (coord.y / iResolution.y);
  vec3 color = rays1 * 0.5 * raysColor + rays2 * 0.4 * raysColor2;
  color *= (1.0 - noiseAmount + noiseAmount * n) * (0.25 + brightness * 0.75);

  float alpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

/** Recipes: a warm spotlight from above, like light falling across a plated dish. */
export const lightRaysScene: ShaderSceneSetup = (gl) => {
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: [1, 1] },
    rayPos: { value: [0, 0] },
    rayDir: { value: [0, 1] },
    raysColor: { value: hexToRgb('#f471aa') },
    raysColor2: { value: hexToRgb('#ffc56b') },
    raysSpeed: { value: 0.9 },
    lightSpread: { value: 0.85 },
    rayLength: { value: 1.6 },
    fadeDistance: { value: 1.1 },
    mousePos: { value: [0.5, 0.5] },
    mouseInfluence: { value: 0.14 },
    noiseAmount: { value: 0.08 },
    distortion: { value: 0.05 },
  };

  return {
    mesh: createFullscreenMesh(gl, fragment, uniforms),
    resize: (width, height) => {
      uniforms.iResolution.value = [width, height];
      uniforms.rayPos.value = [width * 0.5, -height * 0.2];
    },
    update: (seconds, pointer) => {
      uniforms.iTime.value = seconds;
      uniforms.mousePos.value = [pointer.x, 1 - pointer.y];
    },
  };
};
