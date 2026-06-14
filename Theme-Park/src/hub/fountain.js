import { Transform, Cylinder, Mesh, Program } from '../../../ogl/src/index.js'
import { FACILITIES, MATERIAL } from '../constants.js'
import { phongVertex, phongFragment } from '../shaders/phong.js'
import { createLightingUniforms, createDefaultTexture } from './lighting.js'

const waterVertex = /* glsl */ `
    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;

    void main() {
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const waterFragment = /* glsl */ `
    precision highp float;

    uniform samplerCube tEnvMap;
    uniform vec3 uWaterColor;
    uniform vec3 cameraPosition;

    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;

    void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 I = normalize(vWorldPos - cameraPosition);
        vec3 R = reflect(I, N);
        vec3 reflectionColor = textureCube(tEnvMap, R).rgb;

        float fresnel = pow(1.0 - max(dot(-I, N), 0.0), 3.0);
        float reflectionStrength = mix(0.45, 0.9, fresnel);
        vec3 color = mix(uWaterColor, reflectionColor, reflectionStrength);

        gl_FragColor = vec4(color, 1.0);
    }
`

export function createFountain(gl, cubemap) {
    const group = new Transform()
    const [x, y, z] = FACILITIES.FOUNTAIN.pos
    const radius = FACILITIES.FOUNTAIN.radius

    group.position.set(x, y, z)

    const baseGeometry = new Cylinder(gl, {
        radiusTop: radius,
        radiusBottom: radius,
        height: 0.8,
        radialSegments: 96,
        heightSegments: 1,
    })

    const baseProgram = new Program(gl, {
        vertex: phongVertex,
        fragment: phongFragment,
        uniforms: {
            ...createLightingUniforms(),
            uAmbient: { value: MATERIAL.GROUND.ambient },
            uDiffuse: { value: [0.28, 0.25, 0.25] },
            uSpecular: { value: [0.18, 0.16, 0.15] },
            uShininess: { value: 14 },
            uUseMap: { value: 0 },
            uMap: { value: createDefaultTexture(gl) },
        },
    })

    const base = new Mesh(gl, {
        geometry: baseGeometry,
        program: baseProgram,
    })
    base.position.y = 0.4
    base.setParent(group)

    const waterGeometry = new Cylinder(gl, {
        radiusTop: radius * 0.9,
        radiusBottom: radius * 0.9,
        height: 0.02,
        radialSegments: 96,
        heightSegments: 1,
    })

    const waterProgram = new Program(gl, {
        vertex: waterVertex,
        fragment: waterFragment,
        uniforms: {
            tEnvMap: { value: cubemap },
            uWaterColor: { value: [0.02, 0.16, 0.22] },
        },
    })

    const water = new Mesh(gl, {
        geometry: waterGeometry,
        program: waterProgram,
    })
    water.position.y = 0.72
    water.frustumCulled = false
    water.setParent(group)

    return {
        group,
        base,
        update: null,
    }
}
