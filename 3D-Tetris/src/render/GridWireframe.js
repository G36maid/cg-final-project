import { Geometry, Mesh, Program, Color } from '../../../ogl/src/index.js';
import { lineVertex, lineFragment } from './shaders.js';
import { COLORS } from '../core/constants.js';

// Board bounds
const HALF_W = 0.5;  // offset so cell centers align to integers
const X0 = -HALF_W, X1 = 10 - HALF_W;  // -0.5 to 9.5
const Y0 = -HALF_W, Y1 = 20 - HALF_W;  // -0.5 to 19.5
const Z0 = -HALF_W, Z1 = 10 - HALF_W;  // -0.5 to 9.5

export class GridWireframe {
    constructor(gl) {
        // Build line segment vertices for all 12 edges of the box
        const vertices = [];
        const corners = [
            [X0, Y0, Z0], [X1, Y0, Z0], [X1, Y0, Z1], [X0, Y0, Z1], // bottom 4
            [X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1], // top 4
        ];
        
        // Edges: pairs of corner indices
        const edges = [
            [0,1],[1,2],[2,3],[3,0],  // bottom rectangle
            [4,5],[5,6],[6,7],[7,4],  // top rectangle
            [0,4],[1,5],[2,6],[3,7],  // verticals
        ];
        
        edges.forEach(([a,b]) => {
            vertices.push(...corners[a], ...corners[b]);
        });
        
        const geometry = new Geometry(gl, {
            position: { size: 3, data: new Float32Array(vertices) }
        });
        
        const program = new Program(gl, {
            vertex: lineVertex,
            fragment: lineFragment,
            uniforms: {
                uColor: { value: new Color(COLORS.CAGE) },
            }
        });
        
        this.mesh = new Mesh(gl, { geometry, program, mode: gl.LINES });
    }
    
    setParent(parent) { 
        this.mesh.setParent(parent); 
        return this; 
    }
}
