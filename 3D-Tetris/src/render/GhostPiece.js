import { Box, Mesh, Program, Color } from '../../../ogl/src/index.js';
import { ghostVertex, ghostFragment } from './shaders.js';

export class GhostPiece {
    constructor(gl) {
        this.visible = false;
        const geometry = new Box(gl, { width: 0.92, height: 0.92, depth: 0.92 });
        
        this.program = new Program(gl, {
            vertex: ghostVertex,
            fragment: ghostFragment,
            uniforms: {
                uColor: { value: new Color('#FFFFFF') },
                uTime: { value: 0 },
            },
            transparent: true,
            depthWrite: false,
        });
        
        this.meshes = [];
        for (let i = 0; i < 4; i++) {
            const mesh = new Mesh(gl, { geometry, program: this.program });
            mesh.visible = false;
            this.meshes.push(mesh);
        }
    }
    
    sync(ghostCells, colorHex) {
        this.visible = ghostCells !== null;
        if (!this.visible) {
            this.meshes.forEach(m => m.visible = false);
            return;
        }
        
        this.program.uniforms.uColor.value = new Color(colorHex);
        
        for (let i = 0; i < 4; i++) {
            const mesh = this.meshes[i];
            const cell = ghostCells[i];
            if (!cell) { 
                mesh.visible = false; 
                continue; 
            }
            mesh.visible = true;
            mesh.position.set(cell.x, cell.y, cell.z);
        }
    }
    
    update(dt, time) {
        this.program.uniforms.uTime.value = time * 0.001;
    }
    
    setParent(parent) {
        this.meshes.forEach(m => m.setParent(parent));
        return this;
    }
}
