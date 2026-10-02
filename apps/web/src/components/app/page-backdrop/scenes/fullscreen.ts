import { Mesh, Program, Triangle, type OGLRenderingContext } from 'ogl';

export const glsl100Vertex = /* glsl */ `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const glsl300Vertex = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/** One oversized triangle covering the viewport, the usual base for full-screen fragment shaders. */
export function createFullscreenMesh(
  gl: OGLRenderingContext,
  fragment: string,
  uniforms: Record<string, { value: unknown }>,
  vertex = glsl100Vertex,
) {
  const program = new Program(gl, { vertex, fragment, uniforms, depthTest: false });
  return new Mesh(gl, { geometry: new Triangle(gl), program });
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}
