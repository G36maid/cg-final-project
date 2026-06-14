import { Program } from '../../ogl/src/index.js';

export const skyboxVertex = /* glsl */ `
    attribute vec3 position;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 vDir;

    void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const skyboxFragment = /* glsl */ `
    precision highp float;

    uniform samplerCube tCube;

    varying vec3 vDir;

    void main() {
        gl_FragColor = textureCube(tCube, normalize(vDir));
    }
`;

export function createSkyboxProgram(gl) {
    return new Program(gl, {
        vertex: skyboxVertex,
        fragment: skyboxFragment,
        uniforms: {},
        cullFace: gl.FRONT,
        depthWrite: false,
    });
}