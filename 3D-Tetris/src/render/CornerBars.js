import { Mesh, Program, Color, Box } from '../../../ogl/src/index.js';
import { roundedCubeVertex, roundedCubeFragment } from './shaders.js';

const BAR_WIDTH = 0.12;
const BAR_HEIGHT = 20;  // full board height
const CORNERS = [
    [0, 0],    // x,z corner 1
    [10, 0],   // x,z corner 2
    [0, 10],   // x,z corner 3
    [10, 10],  // x,z corner 4
];

export class CornerBars {
    constructor(gl) {
        const program = new Program(gl, {
            vertex: roundedCubeVertex,
            fragment: roundedCubeFragment,
            uniforms: {
                uColor: { value: new Color('#2A3F6E') },
                uEmissiveStrength: { value: 0.4 },
                uTime: { value: 0 },
            }
        });
        
        this.program = program;
        this.bars = [];
        
        const geometry = new Box(gl, { width: 1, height: 1, depth: 1 });
        
        CORNERS.forEach(([cx, cz]) => {
            // Each bar is a thin box at the corner
            const bar = new Mesh(gl, {
                geometry,
                program,
            });
            bar.position.set(cx - 0.5, 9.5, cz - 0.5);
            bar.scale.set(BAR_WIDTH, BAR_HEIGHT, BAR_WIDTH);
            this.bars.push(bar);
        });
    }
    
    update(_dt, time) {
        this.program.uniforms.uTime.value = time * 0.001;
    }
    
    setParent(parent) {
        this.bars.forEach(bar => bar.setParent(parent));
        return this;
    }
}
