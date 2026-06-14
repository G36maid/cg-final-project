import { Program } from '../../ogl/src/index.js';
import { perlinGLSL, fbmGLSL } from './perlin.glsl.js';
import { pointLightUniforms, pointLightFunction } from './lighting.glsl.js';
import { COLORS, MAX_LIGHTS } from '../config.js';

export function createRockProgram(gl) {
    // Replace MAX_LIGHTS placeholder in GLSL chunks
    const uniformsGLSL = pointLightUniforms.replaceAll('MAX_LIGHTS', String(MAX_LIGHTS));
    const functionGLSL = pointLightFunction.replaceAll('MAX_LIGHTS', String(MAX_LIGHTS));
    
    return new Program(gl, {
        vertex: perlinGLSL + fbmGLSL + `
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;

            uniform mat4 modelMatrix;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;

            uniform float uDisplacement;   // displacement amount
            uniform float uNoiseScale;     // noise frequency
            uniform float uTime;

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                
                // Displace position along normal using FBM noise
                float noise = fbm(position * uNoiseScale + uTime * 0.05, 4);
                vec3 displaced = position + normal * noise * uDisplacement;
                
                // Transform normal for lighting
                vNormal = normalize(normalMatrix * normal);
                
                // World position for point lights
                vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
                vWorldPos = worldPos.xyz;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
            }
        `,
        fragment: `
            precision highp float;
            ` + uniformsGLSL + functionGLSL + `

            varying vec3 vWorldPos;
            varying vec3 vNormal;
            varying vec2 vUv;

            void main() {
                vec3 baseColor = vec3(0.12, 0.34, 0.14);
                float roughness = 0.95;
                
                vec3 lit = calcPointLights(vWorldPos, normalize(vNormal), baseColor, roughness);
                
                gl_FragColor.rgb = lit;
                gl_FragColor.a = 1.0;
            }
        `,
        uniforms: {
            uDisplacement: { value: 8.0 },
            uNoiseScale: { value: 0.02 },
            uTime: { value: 0 },
            uAmbient: { value: 0.7 },
            uNumLights: { value: 0 },
            uPointLightPos: { value: new Array(MAX_LIGHTS * 3).fill(0) },
            uPointLightColor: { value: new Array(MAX_LIGHTS * 3).fill(0) },
            uPointLightRange: { value: new Array(MAX_LIGHTS).fill(0) },
        },
    });
}
