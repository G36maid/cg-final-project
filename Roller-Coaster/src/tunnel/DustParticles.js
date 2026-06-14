import { Mesh, Geometry, Vec3, Program } from '../../ogl/src/index.js';
import { TUNNEL_HALF_WIDTH, TUNNEL_HEIGHT, TRACK_DIVISIONS } from '../config.js';

const PARTICLE_COUNT = 80;

export function createDustParticles(gl, trackPath) {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const startFrame = trackPath.tunnelStartFrame + 2;
    const endFrame = trackPath.tunnelEndFrame - 2;
    const frameSpan = Math.max(0, endFrame - startFrame);
    const trackPoint = new Vec3();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const frameIndex = startFrame + Math.floor(Math.random() * (frameSpan + 1));
        const t = frameIndex / TRACK_DIVISIONS;
        const sideOffset = (Math.random() - 0.5) * TUNNEL_HALF_WIDTH * 1.5;
        const upOffset = Math.random() * TUNNEL_HEIGHT * 0.8;
        const normal = trackPath.frames.normals[frameIndex];
        const binormal = trackPath.frames.binormals[frameIndex];

        trackPath.getPointAt(t, trackPoint);

        positions[i * 3 + 0] = trackPoint.x + binormal.x * sideOffset + normal.x * upOffset;
        positions[i * 3 + 1] = trackPoint.y + binormal.y * sideOffset + normal.y * upOffset;
        positions[i * 3 + 2] = trackPoint.z + binormal.z * sideOffset + normal.z * upOffset;
        phases[i] = Math.random() * Math.PI * 2;
    }

    const geom = new Geometry(gl, {
        position: { size: 3, data: positions },
        aPhase: { size: 1, data: phases },
    });

    const program = new Program(gl, {
        vertex: /* glsl */ `
            attribute vec3 position;
            attribute float aPhase;

            uniform float uTime;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;

            varying float vAlpha;

            void main() {
                vec3 pos = position;
                pos.y += sin(uTime * 0.5 + aPhase) * 0.3;
                pos.x += cos(uTime * 0.3 + aPhase * 1.7) * 0.2;

                vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = max(2.0, (80.0 / -mvPos.z));
                gl_Position = projectionMatrix * mvPos;
                vAlpha = 0.3 + 0.2 * sin(uTime + aPhase);
            }
        `,
        fragment: /* glsl */ `
            precision mediump float;

            varying float vAlpha;

            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float d = length(coord);
                if (d > 0.5) discard;

                float alpha = (1.0 - d * 2.0) * vAlpha;
                gl_FragColor = vec4(0.6, 0.5, 0.3, alpha);
            }
        `,
        uniforms: {
            uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
    });

    return new Mesh(gl, { geometry: geom, program: program, mode: gl.POINTS });
}

export function updateDust(mesh, elapsedTime) {
    mesh.program.uniforms.uTime.value = elapsedTime;
}
