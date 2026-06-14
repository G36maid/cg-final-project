import { Box, Geometry, Mesh, Program, Color } from '../../../ogl/src/index.js';
import { PIECE_TYPES, COLORS, WIDTH, HEIGHT, DEPTH } from '../core/constants.js';

const MAX_BLOCKS = WIDTH * HEIGHT * DEPTH; // 2000 max capacity

const instancedVertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 offset;
attribute vec3 aColor;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec3 vColor;

void main() {
    vColor = aColor;
    vLocalPosition = position;
    vec3 pos = position + offset;
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewPosition = -mvPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
}
`;

const instancedFragment = /* glsl */ `
precision highp float;

uniform float uEmissiveStrength; // default: 0.15
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec3 vColor;

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

void main() {
    float d = sdRoundBox(vLocalPosition, vec3(0.45), 0.08);
    float bodyFill = smoothstep(0.02, -0.02, d);
    float edgeGlow = exp(-18.0 * max(d, 0.0)) * (1.0 - bodyFill);

    if (bodyFill < 0.01 && edgeGlow < 0.01) discard;

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(vec3(0.45, 0.8, 0.35));

    float lambert = max(dot(normal, lightDir), 0.0);
    float ambient = 0.28;
    float diffuse = ambient + lambert * 0.72;
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
    float emissive = 1.0 + 0.04 * sin(uTime * 2.5);

    vec3 color = diffuse * vColor
        + emissive * vColor * uEmissiveStrength
        + fresnel * vColor * 0.3
        + edgeGlow * vColor;

    gl_FragColor = vec4(color, bodyFill);
}
`;

export class PlacedBlocks {
    constructor(gl) {
        const boxGeometry = new Box(gl, { width: 0.92, height: 0.92, depth: 0.92 });
        
        // Pre-allocate instanced attribute buffers
        const offsets = new Float32Array(MAX_BLOCKS * 3);
        const colors = new Float32Array(MAX_BLOCKS * 3);
        
        this.geometry = new Geometry(gl, {
            position: { size: 3, data: boxGeometry.attributes.position.data },
            normal: { size: 3, data: boxGeometry.attributes.normal.data },
            uv: { size: 2, data: boxGeometry.attributes.uv.data },
            index: { data: boxGeometry.attributes.index.data },
            // Instanced attributes
            offset: { instanced: 1, size: 3, data: offsets },
            aColor: { instanced: 1, size: 3, data: colors },
        });
        
        this.offsets = offsets;
        this.colors = colors;
        this.count = 0;
        
        this.program = new Program(gl, {
            vertex: instancedVertex,
            fragment: instancedFragment,
            uniforms: {
                uEmissiveStrength: { value: 0.15 },
                uTime: { value: 0 },
            },
            cullFace: gl.BACK,
        });
        
        this.mesh = new Mesh(gl, { geometry: this.geometry, program: this.program });
        this.geometry.setInstancedCount(0);
    }
    
    rebuild(cells) {
        // cells = [{x,y,z,type}] from grid.getOccupiedCells()
        this.count = Math.min(cells.length, MAX_BLOCKS);
        for (let i = 0; i < this.count; i++) {
            const cell = cells[i];
            this.offsets[i * 3] = cell.x;
            this.offsets[i * 3 + 1] = cell.y;
            this.offsets[i * 3 + 2] = cell.z;
            
            const typeName = PIECE_TYPES[cell.type - 1];
            const color = new Color(COLORS[typeName] || '#FFFFFF');
            this.colors[i * 3] = color[0];
            this.colors[i * 3 + 1] = color[1];
            this.colors[i * 3 + 2] = color[2];
        }
        
        this.geometry.attributes.offset.data = this.offsets;
        this.geometry.attributes.offset.needsUpdate = true;
        this.geometry.attributes.aColor.data = this.colors;
        this.geometry.attributes.aColor.needsUpdate = true;
        this.geometry.setInstancedCount(this.count);
    }
    
    update(dt, time) {
        this.program.uniforms.uTime.value = time * 0.001;
    }
    
    setParent(parent) { 
        this.mesh.setParent(parent); 
        return this; 
    }
}
