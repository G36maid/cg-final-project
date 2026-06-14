import { Geometry, Mesh, Program, Vec3 } from '../../../ogl/src/index.js';
import { particleVertex, particleFragment } from './shaders.js';

const MAX_PARTICLES = 500;

export class Particles {
    constructor(gl) {
        this.gl = gl;
        
        // CPU-side particle data
        this.particles = [];
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.particles.push({
                active: false,
                position: new Vec3(),
                velocity: new Vec3(),
                random: [Math.random(), Math.random(), Math.random(), Math.random()],
                life: 0,        // current life: 1.0 = just born, 0.0 = dead
                maxLife: 1.0,   // lifetime in seconds
                age: 0,         // elapsed time
                color: new Vec3(1, 1, 1),
            });
        }
        
        // GPU buffers
        this.positions = new Float32Array(MAX_PARTICLES * 3);
        this.velocities = new Float32Array(MAX_PARTICLES * 3);
        this.randoms = new Float32Array(MAX_PARTICLES * 4);
        this.lives = new Float32Array(MAX_PARTICLES);
        
        for (let i = 0; i < MAX_PARTICLES; i++) {
            this.randoms[i*4] = Math.random();
            this.randoms[i*4+1] = Math.random();
            this.randoms[i*4+2] = Math.random();
            this.randoms[i*4+3] = Math.random();
        }
        
        this.geometry = new Geometry(gl, {
            position: { size: 3, data: this.positions },
            velocity: { size: 3, data: this.velocities },
            random: { size: 4, data: this.randoms },
            life: { size: 1, data: this.lives },
        });
        
        this.program = new Program(gl, {
            vertex: particleVertex,
            fragment: particleFragment,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Vec3(1, 1, 1) },
            },
            transparent: true,
            depthTest: false,
            // Additive blending for glow effect
            blendFunc: [gl.SRC_ALPHA, gl.ONE],
        });
        
        this.mesh = new Mesh(gl, { 
            geometry: this.geometry, 
            program: this.program,
            mode: gl.POINTS,
        });
        
        this.activeCount = 0;
        this._currentTime = 0;
    }
    
    // options: { origin: Vec3, count: number, color: Vec3 or hex string, speed: float, spread: float, mode: 'splash'|'explosion' }
    burst({ origin, count = 25, color, speed = 3, mode = 'splash' }) {
        let spawned = 0;
        const colorVec = typeof color === 'string' ? hexToRgb(color) : color;
        
        for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
            const p = this.particles[i];
            if (p.active) continue;
            
            p.active = true;
            p.position.copy(origin);
            p.age = 0;
            p.life = 1.0;
            p.maxLife = 0.5 + Math.random() * 0.8; // 0.5-1.3 seconds
            p.color = colorVec;
            
            if (mode === 'splash') {
                // Radial splash: mostly upward and outward
                const angle = Math.random() * Math.PI * 2;
                const upward = 0.3 + Math.random() * 0.7;
                const radial = (1 - upward) * speed * (0.5 + Math.random() * 0.5);
                p.velocity.set(
                    Math.cos(angle) * radial,
                    upward * speed * (0.5 + Math.random() * 0.5),
                    Math.sin(angle) * radial,
                );
            } else if (mode === 'explosion') {
                // Spherical explosion: all directions
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const v = speed * (0.5 + Math.random() * 0.5);
                p.velocity.set(
                    Math.sin(phi) * Math.cos(theta) * v,
                    Math.cos(phi) * v,
                    Math.sin(phi) * Math.sin(theta) * v,
                );
            }
            
            // Refresh random for visual variety
            p.random = [Math.random(), Math.random(), Math.random(), Math.random()];
            spawned++;
        }
    }
    
    update(dt) {
        const dtSec = dt * 0.001;
        this._currentTime += dtSec;
        
        for (let i = 0; i < MAX_PARTICLES; i++) {
            const p = this.particles[i];
            if (!p.active) {
                this.lives[i] = 0;
                continue;
            }
            
            p.age += dtSec;
            if (p.age >= p.maxLife) {
                p.active = false;
                this.lives[i] = 0;
                continue;
            }
            
            // Update life (1.0 → 0.0 over maxLife)
            p.life = 1.0 - (p.age / p.maxLife);
            
            // Apply velocity with gravity
            p.velocity[1] -= 9.8 * dtSec * 0.3; // gravity
            p.position[0] += p.velocity[0] * dtSec;
            p.position[1] += p.velocity[1] * dtSec;
            p.position[2] += p.velocity[2] * dtSec;
            
            this.positions[i*3] = p.position[0];
            this.positions[i*3+1] = p.position[1];
            this.positions[i*3+2] = p.position[2];
            this.velocities[i*3] = p.velocity[0];
            this.velocities[i*3+1] = p.velocity[1];
            this.velocities[i*3+2] = p.velocity[2];
            this.lives[i] = p.life;
            this.randoms[i*4] = p.random[0];
            this.randoms[i*4+1] = p.random[1];
            this.randoms[i*4+2] = p.random[2];
            this.randoms[i*4+3] = p.random[3];
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.velocity.needsUpdate = true;
        this.geometry.attributes.life.needsUpdate = true;
        this.geometry.attributes.random.needsUpdate = true;
        
        this.program.uniforms.uTime.value = 0; // Using CPU positions, not shader time
    }
    
    setParent(parent) { this.mesh.setParent(parent); return this; }
}

// Helper: hex string to Vec3 RGB (0-1)
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return new Vec3(r, g, b);
}