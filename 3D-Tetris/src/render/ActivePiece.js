import { Box, Mesh, Program, Color, Vec3 } from '../../../ogl/src/index.js';
import { roundedCubeVertex, roundedCubeFragment } from './shaders.js';
import { createTween, easeOutCubic } from '../systems/Tween.js';

export class ActivePiece {
    constructor(gl, tweenManager) {
        this.gl = gl;
        this.tweenManager = tweenManager;
        this.visible = false;
        
        const geometry = new Box(gl, { width: 0.92, height: 0.92, depth: 0.92 });
        
        this.program = new Program(gl, {
            vertex: roundedCubeVertex,
            fragment: roundedCubeFragment,
            uniforms: {
                uColor: { value: new Color('#FFFFFF') },
                uEmissiveStrength: { value: 0.15 },
                uTime: { value: 0 },
            }
        });
        
        // Pool of 4 meshes (tetrominoes always have 4 cells)
        this.meshes = [];
        for (let i = 0; i < 4; i++) {
            const mesh = new Mesh(gl, { geometry, program: this.program });
            mesh.visible = false;
            this.meshes.push(mesh);
        }
        
        this._targetPositions = [new Vec3(), new Vec3(), new Vec3(), new Vec3()];
        this._tweens = [null, null, null, null];
    }
    
    // pieceCells: [{x,y,z}] from piece.getCells()
    // color: hex string
    sync(pieceCells, colorHex) {
        this.visible = pieceCells !== null;
        
        if (!this.visible) {
            this.meshes.forEach(m => m.visible = false);
            return;
        }
        
        const color = new Color(colorHex);
        this.program.uniforms.uColor.value = color;
        
        for (let i = 0; i < 4; i++) {
            const mesh = this.meshes[i];
            const cell = pieceCells[i];
            
            if (!cell) { 
                mesh.visible = false; 
                continue; 
            }
            
            const wasVisible = mesh.visible;
            mesh.visible = true;
            
            const targetX = cell.x, targetY = cell.y, targetZ = cell.z;
            const startX = mesh.position.x, startY = mesh.position.y, startZ = mesh.position.z;
            
            if (wasVisible && startX === targetX && startY === targetY && startZ === targetZ) {
                continue;
            }
            
            if (this._tweens[i]) {
                this._tweens[i].cancel();
                this._tweens[i] = null;
            }
            
            // If it wasn't visible before, snap instantly
            if (!wasVisible) {
                mesh.position.set(targetX, targetY, targetZ);
                continue;
            }
            
            this._tweens[i] = this.tweenManager.add(createTween({
                duration: 100,
                ease: easeOutCubic,
                onUpdate: (t) => {
                    mesh.position.x = startX + (targetX - startX) * t;
                    mesh.position.y = startY + (targetY - startY) * t;
                    mesh.position.z = startZ + (targetZ - startZ) * t;
                },
                onComplete: () => {
                    this._tweens[i] = null;
                }
            }));
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
