// ============================================================================
// 3D Pinball — Particle System
// gl.POINTS based particles for bumper hit bursts (8-12 particles per hit).
// ============================================================================

import { Geometry, Program, Mesh, Vec4 } from '../../ogl/src/index.js';
import { particleVertex, particleFragment } from './shaders.js';

const MAX_PARTICLES = 300;

export function createParticleSystem(gl) {
    // Pre-allocate buffers
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const colors = new Float32Array(MAX_PARTICLES * 4);
    const sizes = new Float32Array(MAX_PARTICLES);
    const lives = new Float32Array(MAX_PARTICLES);

    // Particle data (CPU side)
    const particles = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push({
            x: 0, y: 0, z: 0,
            vx: 0, vy: 0, vz: 0,
            r: 1, g: 1, b: 1, a: 1,
            size: 4,
            life: 0,
            maxLife: 1,
            active: false,
        });
    }

    const geometry = new Geometry(gl, {
        position: { size: 3, data: positions },
        aColor: { size: 4, data: colors },
        aSize: { size: 1, data: sizes },
        aLife: { size: 1, data: lives },
    });

    const program = new Program(gl, {
        vertex: particleVertex,
        fragment: particleFragment,
        uniforms: {
            uTime: { value: 0 },
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
    });

    const mesh = new Mesh(gl, {
        mode: gl.POINTS,
        geometry,
        program,
    });

    let nextParticle = 0;

    // Spawn a burst of particles at a 2D table position
    function burst(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const p = particles[nextParticle];
            nextParticle = (nextParticle + 1) % MAX_PARTICLES;

            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;

            p.x = x;
            p.y = 0.5;
            p.z = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = 1 + Math.random() * 3;
            p.vz = Math.sin(angle) * speed;
            p.r = color[0];
            p.g = color[1];
            p.b = color[2];
            p.a = 1;
            p.size = 3 + Math.random() * 4;
            p.life = 0.5 + Math.random() * 0.4;
            p.maxLife = p.life;
            p.active = true;
        }
    }

    function update(dt) {
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = particles[i];
            if (!p.active) {
                lives[i] = 0;
                continue;
            }

            p.life -= dt;
            if (p.life <= 0) {
                p.active = false;
                lives[i] = 0;
                continue;
            }

            // Apply gravity to particles
            p.vy -= 8 * dt;
            // Damping
            p.vx *= 0.96;
            p.vz *= 0.96;

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;

            // Don't go below table surface
            if (p.y < 0.1) {
                p.y = 0.1;
                p.vy *= -0.3;
            }

            const lifeRatio = p.life / p.maxLife;

            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;

            colors[i * 4] = p.r;
            colors[i * 4 + 1] = p.g;
            colors[i * 4 + 2] = p.b;
            colors[i * 4 + 3] = lifeRatio;

            sizes[i] = p.size * lifeRatio;
            lives[i] = lifeRatio;
        }

        // Mark buffers for GPU update
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.aColor.needsUpdate = true;
        geometry.attributes.aSize.needsUpdate = true;
        geometry.attributes.aLife.needsUpdate = true;
    }

    return { mesh, burst, update };
}
