import { Geometry, Mesh, Program, Color } from '../../../ogl/src/index.js';
import { ringVertex, ringFragment } from './shaders.js';
import { createTween } from '../systems/Tween.js';

export class DropRing {
    constructor(gl) {
        // Create a flat plane geometry (will be rendered as a ring via fragment shader)
        const vertices = new Float32Array([
            -0.5, 0, -0.5,
             0.5, 0, -0.5,
             0.5, 0,  0.5,
            -0.5, 0,  0.5,
        ]);
        const uvs = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1,
        ]);
        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        
        const geometry = new Geometry(gl, {
            position: { size: 3, data: vertices },
            uv: { size: 2, data: uvs },
            index: { data: indices },
        });
        
        this.program = new Program(gl, {
            vertex: ringVertex,
            fragment: ringFragment,
            uniforms: {
                uColor: { value: new Color('#FFFFFF') },
                uProgress: { value: 0 },
                uOpacity: { value: 0 },
            },
            transparent: true,
            depthWrite: false,
        });
        
        this.mesh = new Mesh(gl, { geometry, program: this.program });
        this.mesh.visible = false;
        this.mesh.rotation.x = -Math.PI / 2; // Lay flat
        this._active = false;
    }
    
    trigger(position, colorHex, scale = 3) {
        this.mesh.position.copy(position);
        this.mesh.scale.set(scale, 1, scale);
        this.program.uniforms.uColor.value = new Color(colorHex);
        this.mesh.visible = true;
        this._active = true;
        
        return createTween({
            duration: 300, // 0.3 seconds
            ease: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
            onUpdate: (t) => {
                this.program.uniforms.uProgress.value = t;
                this.program.uniforms.uOpacity.value = 1.0 - t;
            },
            onComplete: () => {
                this.mesh.visible = false;
                this._active = false;
            },
        });
    }
    
    update(dt, time) {
        // Tween is managed externally via the returned tween object
    }
    
    setParent(parent) { this.mesh.setParent(parent); return this; }
}