import { Transform, Mesh, Vec3, Cylinder, Geometry, Box } from '../../ogl/src/index.js';
import { RAIL_HALF_GAUGE, RAIL_RADIUS } from '../config.js';

function buildRailTubeGeometry(gl, railPoints, normals, binormals) {
    const radialSegments = 6; // hexagonal tube
    const tubularSegments = railPoints.length - 1;
    
    const numVertices = (tubularSegments + 1) * (radialSegments + 1);
    const positions = new Float32Array(numVertices * 3);
    const normalData = new Float32Array(numVertices * 3);
    const uvs = new Float32Array(numVertices * 2);
    const indices = new Uint16Array(tubularSegments * radialSegments * 6);
    
    for (let i = 0; i <= tubularSegments; i++) {
        const ci = i === tubularSegments ? 0 : i; // close the loop
        const point = railPoints[ci];
        const N = normals[ci];
        const B = binormals[ci];
        
        for (let j = 0; j <= radialSegments; j++) {
            const v = (j / radialSegments) * Math.PI * 2;
            const sin = Math.sin(v);
            const cos = -Math.cos(v);
            
            const idx = i * (radialSegments + 1) + j;
            
            // Normal direction
            const nx = cos * N.x + sin * B.x;
            const ny = cos * N.y + sin * B.y;
            const nz = cos * N.z + sin * B.z;
            
            normalData[idx * 3] = nx;
            normalData[idx * 3 + 1] = ny;
            normalData[idx * 3 + 2] = nz;
            
            positions[idx * 3] = point.x + RAIL_RADIUS * nx;
            positions[idx * 3 + 1] = point.y + RAIL_RADIUS * ny;
            positions[idx * 3 + 2] = point.z + RAIL_RADIUS * nz;
            
            uvs[idx * 2] = i / tubularSegments;
            uvs[idx * 2 + 1] = j / radialSegments;
        }
    }
    
    // Generate indices (same pattern as OGL Tube.js)
    for (let j = 1; j <= tubularSegments; j++) {
        for (let i = 1; i <= radialSegments; i++) {
            const a = (radialSegments + 1) * (j - 1) + (i - 1);
            const b = (radialSegments + 1) * j + (i - 1);
            const c = (radialSegments + 1) * j + i;
            const d = (radialSegments + 1) * (j - 1) + i;
            const idx = (j - 1) * radialSegments + (i - 1);
            indices.set([a, b, d, b, c, d], idx * 6);
        }
    }
    
    return new Geometry(gl, {
        position: { size: 3, data: positions },
        normal: { size: 3, data: normalData },
        uv: { size: 2, data: uvs },
        index: { data: indices },
    });
}

export function createTrackGeometry(gl, trackPath, metalProgram) {
    const group = new Transform();
    
    const frames = trackPath.frames;
    const divisions = frames.tangents.length - 1;
    
    const leftRailPoints = [];
    const rightRailPoints = [];
    const centerRailPoints = [];
    
    const tempVec = new Vec3();
    
    for (let i = 0; i <= divisions; i++) {
        const t = i / divisions;
        const center = trackPath.getPointAt(t);
        const binormal = frames.binormals[i];
        
        const leftPoint = new Vec3().copy(center).add(tempVec.copy(binormal).scale(RAIL_HALF_GAUGE));
        const rightPoint = new Vec3().copy(center).sub(tempVec.copy(binormal).scale(RAIL_HALF_GAUGE));
        
        leftRailPoints.push(leftPoint);
        rightRailPoints.push(rightPoint);
        centerRailPoints.push(center);
    }
    
    const leftRailGeom = buildRailTubeGeometry(gl, leftRailPoints, frames.normals, frames.binormals);
    const rightRailGeom = buildRailTubeGeometry(gl, rightRailPoints, frames.normals, frames.binormals);
    const centerRailGeom = buildRailTubeGeometry(gl, centerRailPoints, frames.normals, frames.binormals);
    
    const leftRailMesh = new Mesh(gl, { geometry: leftRailGeom, program: metalProgram });
    const rightRailMesh = new Mesh(gl, { geometry: rightRailGeom, program: metalProgram });
    const centerRailMesh = new Mesh(gl, { geometry: centerRailGeom, program: metalProgram });
    
    leftRailMesh.setParent(group);
    rightRailMesh.setParent(group);
    centerRailMesh.setParent(group);
    
    // Cross-ties
    const tieGeom = new Box(gl, { width: RAIL_HALF_GAUGE * 2 + 0.5, height: 0.3, depth: 0.5 });
    const tieInterval = 16;
    
    for (let i = 0; i < divisions; i += tieInterval) {
        const t = i / divisions;
        const center = trackPath.getPointAt(t);
        const tangent = frames.tangents[i];
        const normal = frames.normals[i];
        
        const tieMesh = new Mesh(gl, { geometry: tieGeom, program: metalProgram });
        tieMesh.position.copy(center);
        
        tieMesh.up.copy(normal);
        const target = new Vec3().copy(center).add(tangent);
        tieMesh.lookAt(target);
        
        tieMesh.setParent(group);
    }
    
    return group;
}
