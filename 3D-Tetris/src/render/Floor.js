import { Geometry, Mesh, Program, Color } from '../../../ogl/src/index.js';
import { lineVertex, lineFragment } from './shaders.js';

export class Floor {
    constructor(gl) {
        // Build all line segments for floor grid
        const vertices = [];
        const Y = -0.5;  // floor level
        const MIN = -0.5, MAX = 9.5;  // board extents
        
        // Outline rectangle (4 edges)
        vertices.push(MIN, Y, MIN, MAX, Y, MIN);  // front edge
        vertices.push(MAX, Y, MIN, MAX, Y, MAX);  // right edge
        vertices.push(MAX, Y, MAX, MIN, Y, MAX);  // back edge
        vertices.push(MIN, Y, MAX, MIN, Y, MIN);  // left edge
        
        // Internal grid lines (X direction: lines parallel to X axis)
        for (let z = 1; z < 10; z++) {
            const zz = z - 0.5;
            vertices.push(MIN, Y, zz, MAX, Y, zz);
        }
        
        // Internal grid lines (Z direction: lines parallel to Z axis)
        for (let x = 1; x < 10; x++) {
            const xx = x - 0.5;
            vertices.push(xx, Y, MIN, xx, Y, MAX);
        }
        
        const geometry = new Geometry(gl, {
            position: { size: 3, data: new Float32Array(vertices) }
        });
        
        const program = new Program(gl, {
            vertex: lineVertex,
            fragment: lineFragment,
            uniforms: {
                uColor: { value: new Color('#0F1530') },  // darker than cage
            }
        });
        
        this.mesh = new Mesh(gl, { geometry, program, mode: gl.LINES });
    }
    
    setParent(parent) { 
        this.mesh.setParent(parent); 
        return this; 
    }
}
