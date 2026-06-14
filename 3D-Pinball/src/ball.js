// ============================================================================
// 3D Pinball — Ball
// Metallic PBR ball with procedural cubemap environment reflection.
// metalness 0.95, real-time envMap sampling via OGL Texture (Cubemap).
// ============================================================================

import { Mesh, Sphere, Program, Texture, Vec3, Color } from '../../ogl/src/index.js';
import { PHYSICS, COLORS } from './constants.js';
import { ballVertex, ballFragment } from './shaders.js';
import { SharedUniforms } from './table.js';

// ── Generate procedural cubemap for environment reflections ────────────────
// Creates 6 canvas images with neon-arcade style gradients + bright spots.
export function createProceduralCubemap(gl) {
    const size = 256;
    const images = [];

    // Color palette for each face: [topColor, bottomColor, spotColor]
    const faces = [
        ['#1a0033', '#000000', '#FF2266'], // +X (right)
        ['#1a0033', '#000000', '#00FFCC'], // -X (left)
        ['#4a0080', '#1a0030', '#FFFFFF'], // +Y (top) — overhead lights, brightest
        ['#05000a', '#000000', '#110022'], // -Y (bottom) - darkest
        ['#1a0033', '#000000', '#FF2266'], // +Z (front)
        ['#1a0033', '#000000', '#00CCFF'], // -Z (back)
    ];

    for (let i = 0; i < 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Base gradient
        const grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0, faces[i][0]);
        grad.addColorStop(1, faces[i][1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        // Add neon spots for interesting reflections
        const spots = [
            { x: 0.25, y: 0.3, r: 30, color: faces[i][2], alpha: 0.4 },
            { x: 0.7, y: 0.6, r: 20, color: faces[i][2], alpha: 0.25 },
            { x: 0.5, y: 0.15, r: 15, color: '#FFFFFF', alpha: 0.15 },
            { x: 0.8, y: 0.85, r: 25, color: '#6644FF', alpha: 0.2 },
            { x: 0.15, y: 0.75, r: 18, color: faces[i][2], alpha: 0.15 },
        ];

        for (const s of spots) {
            const r = Math.max(1, s.r);
            const grad2 = ctx.createRadialGradient(
                s.x * size, s.y * size, 0,
                s.x * size, s.y * size, r
            );
            grad2.addColorStop(0, s.color);
            grad2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.arc(s.x * size, s.y * size, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        images.push(canvas);
    }

    // Create cubemap texture
    const texture = new Texture(gl, {
        target: gl.TEXTURE_CUBE_MAP,
    });
    texture.image = images;

    return texture;
}

// ── Create the ball mesh ───────────────────────────────────────────────────
export function createBall(gl) {
    const radius = PHYSICS.BALL_RADIUS;
    const geometry = new Sphere(gl, {
        radius,
        widthSegments: 32,
        heightSegments: 24,
    });

    const cubemap = createProceduralCubemap(gl);

    const program = new Program(gl, {
        vertex: ballVertex,
        fragment: ballFragment,
        uniforms: {
            ...SharedUniforms,
            tEnvMap: { value: cubemap },
            uColor: { value: new Color(...COLORS.BALL) },
            uMetallic: { value: 0.95 },
            uRoughness: { value: 0.15 },
        },
        cullFace: gl.BACK,
    });

    const mesh = new Mesh(gl, { geometry, program });
    // Start position in plunger lane (will be updated each frame)
    mesh.position.set(9.25, radius, 1.5);

    return { mesh, radius, cubemap };
}

// ── Update ball 3D position from physics ───────────────────────────────────
export function updateBallMesh(ballMesh, physicsBall) {
    // Physics (x, y) → local 3D (x, height, z)
    ballMesh.position.x = physicsBall.x;
    ballMesh.position.y = PHYSICS.BALL_RADIUS;
    ballMesh.position.z = physicsBall.y;

    // Add spin rotation based on velocity (rolling effect)
    ballMesh.rotation.z -= physicsBall.vx * 0.03;
    ballMesh.rotation.x += physicsBall.vy * 0.03;
}
