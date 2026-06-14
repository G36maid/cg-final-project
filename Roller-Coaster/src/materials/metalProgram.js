import { Program } from '../../ogl/src/index.js';
import { COLORS } from '../config.js';

export function createMetalProgram(gl, { color = COLORS.RAIL } = {}) {
    return new Program(gl, {
        vertex: `
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            uniform mat4 modelMatrix;

            varying vec3 vNormal;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: `
            precision highp float;

            uniform vec3 uColor;
            uniform float uAmbient;
            uniform vec3 uLightDir;

            varying vec3 vNormal;
            varying vec2 vUv;

            void main() {
                float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
                gl_FragColor.rgb = uColor * (uAmbient + diff * 0.7);
                gl_FragColor.a = 1.0;
            }
        `,
        uniforms: {
            uColor: { value: color },
            uAmbient: { value: 0.3 },
            uLightDir: { value: [0.5, 0.8, 0.3] },
        },
    });
}
