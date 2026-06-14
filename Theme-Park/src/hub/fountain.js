import { Transform, Cylinder, Sphere, Mesh, Program } from '../../../ogl/src/index.js'
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

const jetVertex = /* glsl */ `
    attribute vec3 position;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const jetFragment = /* glsl */ `
    precision highp float;

    uniform vec3 uColor;
    uniform float uAlpha;

    void main() {
        gl_FragColor = vec4(uColor, uAlpha);
    }
`

function createPhongMesh(gl, geometry, material, color) {
    const program = new Program(gl, {
        vertex: phongVertex,
        fragment: phongFragment,
        uniforms: {
            ...createLightingUniforms(),
            uAmbient: { value: material.ambient },
            uDiffuse: { value: color },
            uSpecular: { value: material.specular },
            uShininess: { value: material.shininess },
            uUseMap: { value: 0 },
            uMap: { value: createDefaultTexture(gl) },
        },
    })

    return new Mesh(gl, { geometry, program })
}

export function createFountain(gl, cubemap) {
    const group = new Transform()
    const [x, y, z] = FACILITIES.FOUNTAIN.pos
    const radius = FACILITIES.FOUNTAIN.radius

    group.position.set(x, y, z)

    const baseGeometry = new Cylinder(gl, {
        radiusTop: radius * 1.08,
        radiusBottom: radius * 1.18,
        height: 0.65,
        radialSegments: 96,
        heightSegments: 1,
    })

    const base = createPhongMesh(gl, baseGeometry, MATERIAL.GROUND, [0.36, 0.31, 0.28])
    base.position.y = 0.32
    base.setParent(group)

    const rimGeometry = new Cylinder(gl, {
        radiusTop: radius * 1.16,
        radiusBottom: radius * 1.08,
        height: 0.28,
        radialSegments: 96,
    })
    const rim = createPhongMesh(gl, rimGeometry, MATERIAL.BUILDING, [0.58, 0.45, 0.38])
    rim.position.y = 0.78
    rim.setParent(group)

    const upperBasinGeometry = new Cylinder(gl, {
        radiusTop: radius * 0.48,
        radiusBottom: radius * 0.36,
        height: 0.34,
        radialSegments: 72,
    })
    const upperBasin = createPhongMesh(gl, upperBasinGeometry, MATERIAL.BUILDING, [0.60, 0.48, 0.42])
    upperBasin.position.y = 1.45
    upperBasin.setParent(group)

    const pedestalGeometry = new Cylinder(gl, {
        radiusTop: 0.48,
        radiusBottom: 0.62,
        height: 1.25,
        radialSegments: 48,
    })
    const pedestal = createPhongMesh(gl, pedestalGeometry, MATERIAL.METAL, [0.33, 0.31, 0.36])
    pedestal.position.y = 1.12
    pedestal.setParent(group)

    const orbGeometry = new Sphere(gl, {
        radius: 0.46,
        widthSegments: 32,
        heightSegments: 16,
    })
    const orb = createPhongMesh(gl, orbGeometry, MATERIAL.METAL, [0.35, 0.62, 0.88])
    orb.position.y = 2.35
    orb.setParent(group)

    const waterGeometry = new Cylinder(gl, {
        radiusTop: radius * 0.9,
        radiusBottom: radius * 0.9,
        height: 0.04,
        radialSegments: 96,
        heightSegments: 1,
    })

    const waterProgram = new Program(gl, {
        vertex: waterVertex,
        fragment: waterFragment,
        uniforms: {
            tEnvMap: { value: cubemap },
            uWaterColor: { value: [0.04, 0.28, 0.34] },
        },
    })

    const water = new Mesh(gl, {
        geometry: waterGeometry,
        program: waterProgram,
    })
    water.position.y = 0.72
    water.frustumCulled = false
    water.setParent(group)

    const upperWater = new Mesh(gl, {
        geometry: new Cylinder(gl, {
            radiusTop: radius * 0.42,
            radiusBottom: radius * 0.42,
            height: 0.035,
            radialSegments: 72,
        }),
        program: waterProgram,
    })
    upperWater.position.y = 1.64
    upperWater.frustumCulled = false
    upperWater.setParent(group)

    const jetProgram = new Program(gl, {
        vertex: jetVertex,
        fragment: jetFragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
            uColor: { value: [0.45, 0.82, 1.0] },
            uAlpha: { value: 0.78 },
        },
    })

    const jetGeometry = new Cylinder(gl, {
        radiusTop: 0.05,
        radiusBottom: 0.08,
        height: 2.4,
        radialSegments: 18,
    })

    const jetOffsets = [[0, 0]]

    for (let i = 0; i < 8; i++) {
        const angle = i / 8 * Math.PI * 2
        jetOffsets.push([Math.cos(angle) * 1.05, Math.sin(angle) * 1.05])
    }

    for (const [offsetX, offsetZ] of jetOffsets) {
        const jet = new Mesh(gl, { geometry: jetGeometry, program: jetProgram })
        jet.position.set(offsetX, offsetX === 0 && offsetZ === 0 ? 2.25 : 1.68, offsetZ)
        jet.setParent(group)
    }

    const sparkleGeometry = new Sphere(gl, {
        radius: 0.09,
        widthSegments: 12,
        heightSegments: 8,
    })
    for (let i = 0; i < 16; i++) {
        const angle = i / 16 * Math.PI * 2
        const sparkle = createPhongMesh(gl, sparkleGeometry, MATERIAL.METAL, [0.60, 0.86, 1.0])
        sparkle.position.set(Math.cos(angle) * 2.7, 1.03 + (i % 2) * 0.16, Math.sin(angle) * 2.7)
        sparkle.setParent(group)
    }

    return {
        group,
        base,
        water,
        upperWater,
        update: null,
    }
}
