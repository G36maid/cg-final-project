import { Geometry, Vec3 } from '../../ogl/src/index.js';
import { TUNNEL_HALF_WIDTH, TUNNEL_HEIGHT, TRACK_DIVISIONS } from '../config.js';

function archPoint(v) {
    // v ∈ [0, 1] traces the cross-section from bottom-left → up → over the arch → down → bottom-right
    const wallHeight = TUNNEL_HEIGHT - TUNNEL_HALF_WIDTH; // height where arch begins
    const archRadius = TUNNEL_HALF_WIDTH;
    
    if (v < 0.25) {
        // Left wall going up: from (-halfWidth, 0) to (-halfWidth, wallHeight)
        const t = v / 0.25;
        return { side: -TUNNEL_HALF_WIDTH, up: t * wallHeight };
    } else if (v < 0.75) {
        // Arch: semicircle from left springline over to right springline
        const t = (v - 0.25) / 0.5; // 0 to 1
        const angle = Math.PI * t; // 0 to π
        return {
            side: -archRadius * Math.cos(angle),
            up: wallHeight + archRadius * Math.sin(angle)
        };
    } else {
        // Right wall going down: from (halfWidth, wallHeight) to (halfWidth, 0)
        const t = (v - 0.75) / 0.25;
        return { side: TUNNEL_HALF_WIDTH, up: wallHeight * (1 - t) };
    }
}

function archNormal(v) {
    if (v < 0.25) {
        return { side: 1, up: 0 };
    } else if (v < 0.75) {
        const t = (v - 0.25) / 0.5;
        const angle = Math.PI * t;
        return {
            side: Math.cos(angle),
            up: -Math.sin(angle)
        };
    } else {
        return { side: -1, up: 0 };
    }
}

export function createTunnelGeometry(gl, trackPath) {
    const startFrame = trackPath.tunnelStartFrame;
    const endFrame = trackPath.tunnelEndFrame;
    const frames = trackPath.frames;
    
    const crossSegments = 16;
    const longitudinalSegments = endFrame - startFrame;
    
    const vertexCount = (longitudinalSegments + 1) * (crossSegments + 1);
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    
    const indexCount = longitudinalSegments * crossSegments * 6;
    const indices = new (vertexCount > 65535 ? Uint32Array : Uint16Array)(indexCount);
    
    const tempPoint = new Vec3();
    const tempNormal = new Vec3();
    
    let vIdx = 0;
    let uvIdx = 0;
    
    for (let i = 0; i <= longitudinalSegments; i++) {
        const frameIndex = startFrame + i;
        const t = frameIndex / TRACK_DIVISIONS;
        
        trackPath.getPointAt(t, tempPoint);
        const N = frames.normals[frameIndex];
        const B = frames.binormals[frameIndex];
        
        for (let j = 0; j <= crossSegments; j++) {
            const v = j / crossSegments;
            const { side, up } = archPoint(v);
            const { side: nSide, up: nUp } = archNormal(v);
            
            // Position: point + B * side + N * up
            positions[vIdx * 3 + 0] = tempPoint.x + B.x * side + N.x * up;
            positions[vIdx * 3 + 1] = tempPoint.y + B.y * side + N.y * up;
            positions[vIdx * 3 + 2] = tempPoint.z + B.z * side + N.z * up;
            
            // Normal: (B * nSide + N * nUp).normalize()
            tempNormal.x = B.x * nSide + N.x * nUp;
            tempNormal.y = B.y * nSide + N.y * nUp;
            tempNormal.z = B.z * nSide + N.z * nUp;
            tempNormal.normalize();
            
            normals[vIdx * 3 + 0] = tempNormal.x;
            normals[vIdx * 3 + 1] = tempNormal.y;
            normals[vIdx * 3 + 2] = tempNormal.z;
            
            // UVs
            uvs[uvIdx * 2 + 0] = i / longitudinalSegments;
            uvs[uvIdx * 2 + 1] = v;
            
            vIdx++;
            uvIdx++;
        }
    }
    
    let iIdx = 0;
    for (let i = 0; i < longitudinalSegments; i++) {
        for (let j = 0; j < crossSegments; j++) {
            const a = i * (crossSegments + 1) + j;
            const b = (i + 1) * (crossSegments + 1) + j;
            const c = (i + 1) * (crossSegments + 1) + (j + 1);
            const d = i * (crossSegments + 1) + (j + 1);
            
            // Winding: a, b, d and b, c, d
            indices[iIdx++] = a;
            indices[iIdx++] = b;
            indices[iIdx++] = d;
            
            indices[iIdx++] = b;
            indices[iIdx++] = c;
            indices[iIdx++] = d;
        }
    }
    
    return new Geometry(gl, {
        position: { size: 3, data: positions },
        normal: { size: 3, data: normals },
        uv: { size: 2, data: uvs },
        index: { data: indices },
    });
}
